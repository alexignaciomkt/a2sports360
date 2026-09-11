import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', request.url));
  }

  try {
    // 1. Verify SSO JWT Stateless
    const ssoSecret = process.env.A2SPORTS_SSO_SECRET;
    if (!ssoSecret) {
      console.error('[SSO] SSO_SECRET_MISSING configuration missing.');
      return NextResponse.redirect(new URL('/login?error=sso_internal_error', request.url));
    }

    const secret = new TextEncoder().encode(ssoSecret);
    let jwtPayload;
    
    try {
      const { payload } = await jwtVerify(token, secret, {
        issuer: 'A2TICKETS',
        audience: 'A2SPORTS',
      });
      jwtPayload = payload;
    } catch (err: any) {
      console.error('[SSO] JWT validation failed:', err.message);
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    const {
      email: organizer_email,
      tenant_external_id: external_tenant_id,
      championship_id: sports_championship_id
    } = jwtPayload as any;

    const tickets_user_id = jwtPayload.sub;

    if (!organizer_email || !external_tenant_id || !sports_championship_id) {
      console.error('[SSO] JWT missing required claims.');
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    // 2. Resolve Tenant local mapping
    const { data: mappingData, error: mappingError } = await adminClient
      .from('tenant_mappings')
      .select('tenant_id')
      .eq('source_system', 'A2TICKETS')
      .eq('external_tenant_id', external_tenant_id)
      .maybeSingle();

    if (mappingError || !mappingData) {
      console.error('[SSO] Tenant mapping lookup failed. Looking for external_tenant_id:', external_tenant_id, 'Error:', mappingError || 'Mapping not found');
      return NextResponse.redirect(new URL('/login?error=tenant_not_mapped', request.url));
    }

    const tenantId = mappingData.tenant_id;

    // 3. Find or Create User in Supabase Auth (Federated Identity)
    let authUser;
    
    // First try creating user
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email: organizer_email,
      email_confirm: true,
      user_metadata: {
        source_system: 'A2TICKETS',
        external_user_id: tickets_user_id
      }
    });

    if (createError) {
      // Check if user already exists
      const { data: usersList, error: listError } = await adminClient.auth.admin.listUsers();
      if (listError) throw listError;

      const existingUser = usersList.users.find(u => u.email === organizer_email);
      if (!existingUser) {
        throw createError; // Throw original creation error if not found
      }
      authUser = existingUser;
    } else {
      authUser = createData.user;
    }

    if (!authUser) {
      throw new Error('Falha ao obter ou criar usuário federado.');
    }

    // 4. Ensure public.profiles contains mapping to the correct tenant
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, tenant_id')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!profile) {
      const { error: profileInsertError } = await adminClient
        .from('profiles')
        .insert({
          id: authUser.id,
          tenant_id: tenantId
        });
      if (profileInsertError) throw profileInsertError;
    } else if (profile.tenant_id !== tenantId) {
      const { error: profileUpdateError } = await adminClient
        .from('profiles')
        .update({ tenant_id: tenantId })
        .eq('id', authUser.id);
      if (profileUpdateError) throw profileUpdateError;
    }

    // 5. Generate Magic Link session link
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: organizer_email
    });

    if (linkError || !linkData?.properties?.action_link) {
      throw linkError || new Error('Falha ao gerar link de autenticação.');
    }

    // Extract token_hash from properties or action_link
    const actionUrl = new URL(linkData.properties.action_link);
    const tokenHash = linkData.properties.hashed_token || actionUrl.searchParams.get('token') || actionUrl.searchParams.get('token_hash');

    if (!tokenHash) {
      throw new Error('Token hash ausente no link retornado.');
    }

    // 6. Verify OTP locally and write cookies directly to the redirected response object
    const response = NextResponse.redirect(new URL(`/championships/${sports_championship_id}`, request.url));

    // Create client using response cookie mapping to guarantee cookies are set correctly on Next.js redirect
    const { createServerClient } = await import('@supabase/ssr');
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                ...options,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
              });
            });
          },
        },
      }
    );

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'magiclink'
    });

    if (verifyError) throw verifyError;

    // 7. Return response containing auth cookies
    return response;

  } catch (err: any) {
    console.error('[SSO-FLOW] Critical error:', err.message || err);
    return NextResponse.redirect(new URL(`/login?error=sso_internal_error`, request.url));
  }
}

