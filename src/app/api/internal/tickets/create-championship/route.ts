import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

// Reusable function for constant-time string comparison
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Zod Schema for validation
const payloadSchema = z.object({
  source_system: z.literal('A2TICKETS'),
  external_event_id: z.string().min(1),
  tenant_external_id: z.string().min(1),
  organizer_external_id: z.string().min(1),
  organizer_name: z.string().min(1),
  championship_name: z.string().min(1),
  modality: z.literal('truco_duplas'),
  format: z.string().min(1),
  target_score: z.number().int().positive(),
  starts_at: z.string().datetime().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomBytes(16).toString('hex');
  const logData: Record<string, unknown> = {
    request_id: requestId,
    timestamp: new Date().toISOString(),
    endpoint: '/api/internal/tickets/create-championship',
    status_code: 500,
    success: false,
    duration_ms: 0
  };

  try {
    // 1. API Key Validation
    const authHeader = request.headers.get('X-A2-API-KEY') || '';
    const validKey = process.env.A2_INTERNAL_API_KEY || '';

    if (!validKey || !authHeader || !timingSafeEqual(authHeader, validKey)) {
      logData.status_code = 401;
      logData.error_code = 'UNAUTHORIZED';
      logData.duration_ms = Date.now() - startTime;
      console.log(JSON.stringify(logData));
      
      return NextResponse.json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Credenciais inválidas.',
        request_id: requestId
      }, { status: 401 });
    }

    // 2. Payload Validation
    let rawPayload;
    try {
      rawPayload = await request.json();
    } catch {
      logData.status_code = 422;
      logData.error_code = 'INVALID_JSON';
      logData.duration_ms = Date.now() - startTime;
      console.log(JSON.stringify(logData));
      
      return NextResponse.json({
        success: false,
        code: 'INVALID_JSON',
        message: 'Payload JSON inválido.',
        request_id: requestId
      }, { status: 422 });
    }

    const parseResult = payloadSchema.safeParse(rawPayload);
    if (!parseResult.success) {
      logData.status_code = 422;
      logData.error_code = 'INVALID_PAYLOAD';
      logData.duration_ms = Date.now() - startTime;
      console.log(JSON.stringify(logData));
      
      return NextResponse.json({
        success: false,
        code: 'INVALID_PAYLOAD',
        message: 'Payload não está de acordo com o contrato.',
        errors: parseResult.error.format(),
        request_id: requestId
      }, { status: 422 });
    }

    const payload = parseResult.data;
    
    // Check metadata size (arbitrary limit of ~10KB stringified to avoid abuse)
    if (payload.metadata && JSON.stringify(payload.metadata).length > 10240) {
      logData.status_code = 422;
      logData.error_code = 'METADATA_TOO_LARGE';
      logData.duration_ms = Date.now() - startTime;
      console.log(JSON.stringify(logData));
      
      return NextResponse.json({
        success: false,
        code: 'INVALID_PAYLOAD',
        message: 'O campo metadata excede o tamanho permitido.',
        request_id: requestId
      }, { status: 422 });
    }

    logData.source_system = payload.source_system;
    logData.external_event_id = payload.external_event_id;
    logData.tenant_external_id = payload.tenant_external_id;

    // 3. Resolve Tenant Mapping
    const { data: mappingData, error: mappingError } = await adminClient
      .from('tenant_mappings')
      .select('tenant_id')
      .eq('source_system', payload.source_system)
      .eq('external_tenant_id', payload.tenant_external_id)
      .single();

    if (mappingError || !mappingData) {
      logData.status_code = 404;
      logData.error_code = 'TENANT_MAPPING_NOT_FOUND';
      logData.duration_ms = Date.now() - startTime;
      console.log(JSON.stringify(logData));
      
      return NextResponse.json({
        success: false,
        code: 'TENANT_MAPPING_NOT_FOUND',
        message: 'O organizador ainda não está vinculado à A2Sports360.',
        request_id: requestId
      }, { status: 404 });
    }

    const tenantId = mappingData.tenant_id;
    logData.tenant_id = tenantId;

    // 4. Combine metadata
    const finalMetadata = {
      ...payload.metadata,
      organizer_name: payload.organizer_name,
      organizer_external_id: payload.organizer_external_id,
      integration_version: '1.0'
    };

    // 5. Try Insert Championship
    const { data: insertedChampionship, error: insertError } = await adminClient
      .from('championships')
      .insert({
        tenant_id: tenantId,
        name: payload.championship_name,
        modality: payload.modality,
        format: payload.format,
        target_score: payload.target_score,
        status: 'draft',
        source_system: payload.source_system,
        external_event_id: payload.external_event_id,
        starts_at: payload.starts_at || null,
        metadata: finalMetadata
      })
      .select('id, status')
      .single();

    if (insertError) {
      // 6. Handle Unique Violation (PostgreSQL code 23505)
      if (insertError.code === '23505') {
        const { data: existingData, error: existingError } = await adminClient
          .from('championships')
          .select('id, tenant_id, name, modality, format, target_score, status')
          .eq('source_system', payload.source_system)
          .eq('external_event_id', payload.external_event_id)
          .single();

        if (existingError || !existingData) {
          logData.status_code = 500;
          logData.error_code = 'FETCH_EXISTING_FAILED';
          logData.duration_ms = Date.now() - startTime;
          console.log(JSON.stringify(logData));
          
          return NextResponse.json({
            success: false,
            code: 'INTERNAL_ERROR',
            message: 'Erro ao validar concorrência do campeonato.',
            request_id: requestId
          }, { status: 500 });
        }

        // 7. Compare compatibility
        const isCompatible = 
          existingData.tenant_id === tenantId &&
          existingData.name === payload.championship_name &&
          existingData.modality === payload.modality &&
          existingData.format === payload.format &&
          existingData.target_score === payload.target_score;

        if (isCompatible) {
          logData.status_code = 200;
          logData.success = true;
          logData.duration_ms = Date.now() - startTime;
          console.log(JSON.stringify(logData));
          
          return NextResponse.json({
            success: true,
            created: false,
            already_exists: true,
            championship_id: existingData.id,
            status: existingData.status,
            request_id: requestId
          }, { status: 200 });
        } else {
          logData.status_code = 409;
          logData.error_code = 'EXTERNAL_EVENT_CONFLICT';
          logData.duration_ms = Date.now() - startTime;
          console.log(JSON.stringify(logData));
          
          return NextResponse.json({
            success: false,
            code: 'EXTERNAL_EVENT_CONFLICT',
            message: 'O identificador externo já está vinculado a outro campeonato.',
            request_id: requestId
          }, { status: 409 });
        }
      }

      // If not unique violation, standard 500
      logData.status_code = 500;
      logData.error_code = 'INSERT_ERROR';
      logData.duration_ms = Date.now() - startTime;
      console.log(JSON.stringify(logData));
      
      return NextResponse.json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Erro interno ao criar campeonato.',
        request_id: requestId
      }, { status: 500 });
    }

    // 8. Success Creation
    logData.status_code = 201;
    logData.success = true;
    logData.duration_ms = Date.now() - startTime;
    console.log(JSON.stringify(logData));
    
    return NextResponse.json({
      championship_id: insertedChampionship.id,
      status: insertedChampionship.status,
      created: true
    }, { status: 201 });

  } catch {
    logData.status_code = 500;
    logData.error_code = 'UNHANDLED_EXCEPTION';
    logData.duration_ms = Date.now() - startTime;
    console.log(JSON.stringify(logData));
    
    return NextResponse.json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Ocorreu um erro interno inesperado.',
      request_id: requestId
    }, { status: 500 });
  }
}
