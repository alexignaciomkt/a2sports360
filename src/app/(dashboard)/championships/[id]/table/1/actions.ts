"use server"

import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { randomBytes, createHash } from "crypto"
import { cookies } from "next/headers"

export async function ensureControlSession(championshipId: string, matchId: string, tableId: string) {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const cookieStore = await cookies()
  const existingToken = cookieStore.get('a2sports_control_token')?.value
  const existingTokenHash = existingToken ? createHash('sha256').update(existingToken).digest('hex') : null

  const newRawToken = randomBytes(32).toString('hex')
  const newTokenHash = createHash('sha256').update(newRawToken).digest('hex')

  const { data, error } = await supabase.rpc('ensure_control_session', {
    p_tenant_id: tenantId,
    p_championship_id: championshipId,
    p_resource_id: tableId,
    p_match_id: matchId,
    p_existing_token_hash: existingTokenHash || '',
    p_new_token_hash: newTokenHash
  })

  if (error) {
    console.error("ensureControlSession RPC Error:", error)
    return { success: false, state: 'error' }
  }

  const status = (data as { status?: string })?.status

  if (status === 'reused') {
    return { success: true, state: 'active' }
  }

  if (status === 'created') {
    cookieStore.set('a2sports_control_token', newRawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: `/championships/${championshipId}/table`,
      maxAge: 12 * 60 * 60
    })
    return { success: true, state: 'active' }
  }

  if (status === 'control_session_already_active') {
    return { success: true, state: 'occupied_by_another_session' }
  }

  return { success: false, state: 'error' }
}

export async function takeOverControlSession(championshipId: string, matchId: string, tableId: string) {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  const newRawToken = randomBytes(32).toString('hex')
  const newTokenHash = createHash('sha256').update(newRawToken).digest('hex')

  const { error } = await supabase.rpc('take_over_control_session', {
    p_tenant_id: tenantId,
    p_championship_id: championshipId,
    p_resource_id: tableId,
    p_match_id: matchId,
    p_new_token_hash: newTokenHash
  })

  if (error) {
    console.error("takeOverControlSession RPC Error:", error)
    return { success: false, state: 'error' }
  }

  const cookieStore = await cookies()
  cookieStore.set('a2sports_control_token', newRawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: `/championships/${championshipId}/table`,
    maxAge: 12 * 60 * 60
  })

  return { success: true, state: 'active' }
}

export async function registerPoint(matchId: string, teamId: string, points: number, deviceId: string) {
  try {
    await requireTenant()
    const supabase = await createClient()
    
    const cookieStore = await cookies()
    const token = cookieStore.get('a2sports_control_token')?.value
    if (!token) {
      return { success: false, error: 'Sessão de controle expirada. Renove a sessão.', expired: true }
    }
    const tokenHash = createHash('sha256').update(token).digest('hex')
    
    const { data, error } = await supabase.rpc('register_match_event', {
      p_device_id: deviceId,
      p_event_type: 'point_scored',
      p_match_id: matchId,
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

export async function undoLastPoint(matchId: string) {
  try {
    await requireTenant()
    const supabase = await createClient()
    
    const cookieStore = await cookies()
    const token = cookieStore.get('a2sports_control_token')?.value
    if (!token) {
      return { success: false, error: 'Sessão de controle expirada. Renove a sessão.', expired: true }
    }
    const tokenHash = createHash('sha256').update(token).digest('hex')

    const { data, error } = await supabase.rpc('undo_match_event', {
      p_match_id: matchId,
      p_session_token_hash: tokenHash
    })

    if (error) {
      if (error.message.includes('invalid_or_expired_session')) {
        return { success: false, error: 'Sessão de controle expirada. Renove a sessão.', expired: true }
      }
      throw error
    }
    return { success: true, state: data }
  } catch (error: unknown) {
    console.error("undoLastPoint Error:", error)
    const msg = error instanceof Error ? error.message : (error as { message?: string })?.message || "Erro ao desfazer ponto."
    return { success: false, error: msg }
  }
}
