"use server"

import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ResourceService } from "@/domains/resource/resource.service"
import { randomBytes, createHash } from "crypto"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// --- Internal Helpers ---

async function validateResourceAccess(championshipId: string, resourceId: string) {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()
  const resourceService = new ResourceService(supabase)

  const resource = await resourceService.getResource(resourceId, tenantId)

  if (!resource) {
    throw new Error("Resource não encontrado ou não pertence ao tenant.")
  }

  if (resource.championshipId !== championshipId) {
    throw new Error("Resource não pertence a este campeonato.")
  }

  return { tenantId, supabase, resource }
}

function resolveTokenHash(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

async function clearLegacyCookie(championshipId: string) {
  const cookieStore = await cookies()
  // Remove o cookie legado que usava path /championships/[id]/table
  cookieStore.set('a2sports_control_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: `/championships/${championshipId}/table`,
    maxAge: 0
  })
}

async function setControlCookie(championshipId: string, rawToken: string) {
  const cookieStore = await cookies()
  // Limpar cookie legado antes de gravar o novo
  await clearLegacyCookie(championshipId)
  // Gravar cookie no path canônico
  cookieStore.set('a2sports_control_token', rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: `/championships/${championshipId}`,
    maxAge: 12 * 60 * 60
  })
}

// --- Public Server Actions ---

export async function startControlSession(championshipId: string, resourceId: string) {
  const { tenantId, supabase, resource } = await validateResourceAccess(championshipId, resourceId)

  if (!resource.activeGameId) {
    return { success: true, state: 'missing' as const }
  }

  const cookieStore = await cookies()
  const existingToken = cookieStore.get('a2sports_control_token')?.value
  const existingTokenHash = existingToken ? resolveTokenHash(existingToken) : null

  const newRawToken = randomBytes(32).toString('hex')
  const newTokenHash = resolveTokenHash(newRawToken)

  const { data, error } = await supabase.rpc('ensure_control_session', {
    p_tenant_id: tenantId,
    p_championship_id: championshipId,
    p_resource_id: resourceId,
    p_match_id: resource.activeGameId,
    p_existing_token_hash: existingTokenHash || '',
    p_new_token_hash: newTokenHash
  })

  if (error) {
    console.error("startControlSession RPC Error:", error)
    return { success: false, state: 'error' as const }
  }

  const status = (data as { status?: string })?.status

  if (status === 'reused') {
    return { success: true, state: 'active' as const }
  }

  if (status === 'created') {
    await setControlCookie(championshipId, newRawToken)
    revalidatePath(`/championships/${championshipId}/resources/${resourceId}/control`)
    return { success: true, state: 'active' as const }
  }

  if (status === 'control_session_already_active') {
    return { success: true, state: 'occupied_by_another_session' as const }
  }

  return { success: false, state: 'error' as const }
}

export async function takeOverControlSession(championshipId: string, resourceId: string) {
  const { tenantId, supabase, resource } = await validateResourceAccess(championshipId, resourceId)

  if (!resource.activeGameId) {
    return { success: false, state: 'error' as const }
  }

  const newRawToken = randomBytes(32).toString('hex')
  const newTokenHash = resolveTokenHash(newRawToken)

  const { error } = await supabase.rpc('take_over_control_session', {
    p_tenant_id: tenantId,
    p_championship_id: championshipId,
    p_resource_id: resourceId,
    p_match_id: resource.activeGameId,
    p_new_token_hash: newTokenHash
  })

  if (error) {
    console.error("takeOverControlSession RPC Error:", error)
    return { success: false, state: 'error' as const }
  }

  await setControlCookie(championshipId, newRawToken)
  revalidatePath(`/championships/${championshipId}/resources/${resourceId}/control`)
  return { success: true, state: 'active' as const }
}

export async function registerPoint(
  championshipId: string,
  resourceId: string,
  teamId: string,
  points: number,
  deviceId: string
) {
  try {
    const { supabase, resource } = await validateResourceAccess(championshipId, resourceId)

    if (!resource.activeGameId) {
      return { success: false, error: 'Nenhum confronto ativo neste Local.' }
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('a2sports_control_token')?.value
    if (!token) {
      return { success: false, error: 'Sessão de controle expirada. Renove a sessão.', expired: true }
    }
    const tokenHash = resolveTokenHash(token)

    const { data, error } = await supabase.rpc('register_match_event', {
      p_device_id: deviceId,
      p_event_type: 'point_scored',
      p_match_id: resource.activeGameId,
      p_metadata: {},
      p_points_delta: points,
      p_session_token_hash: tokenHash,
      p_team_id: teamId
    })

    if (error) {
      if (error.message.includes('invalid_or_expired_session')) {
        return { success: false, error: 'Sessão de controle expirada. Renove a sessão.', expired: true }
      }
      throw error
    }
    return { success: true, state: data }
  } catch (error: unknown) {
    console.error("registerPoint Error:", error)
    const msg = error instanceof Error ? error.message : (error as { message?: string })?.message || "Erro ao registrar ponto."
    return { success: false, error: msg }
  }
}

export async function undoLastPoint(
  championshipId: string,
  resourceId: string
) {
  try {
    const { supabase, resource } = await validateResourceAccess(championshipId, resourceId)

    if (!resource.activeGameId) {
      return { success: false, error: 'Nenhum confronto ativo neste Local.' }
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('a2sports_control_token')?.value
    if (!token) {
      return { success: false, error: 'Sessão de controle expirada. Renove a sessão.', expired: true }
    }
    const tokenHash = resolveTokenHash(token)

    const { data, error } = await supabase.rpc('undo_match_event', {
      p_match_id: resource.activeGameId,
      p_session_token_hash: tokenHash
    })

    if (error) {
      if (error.message.includes('invalid_or_expired_session')) {
        return { success: false, error: 'Sessão de controle expirada. Renove a sessão.', expired: true }
      }
      throw error
    }

    // Revalidar rota canônica para garantir que troca de queda funcione
    revalidatePath(`/championships/${championshipId}/resources/${resourceId}/control`)

    return { success: true, state: data }
  } catch (error: unknown) {
    console.error("undoLastPoint Error:", error)
    const msg = error instanceof Error ? error.message : (error as { message?: string })?.message || "Erro ao desfazer ponto."
    return { success: false, error: msg }
  }
}
