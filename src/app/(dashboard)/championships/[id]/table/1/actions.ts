"use server"

import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { randomBytes, createHash } from "crypto"

export async function ensureControlSession(matchId: string, tableId: string) {
  const supabase = await createClient()

  // Verify match
  const { data: match } = await supabase
    .from('matches')
    .select('status')
    .eq('id', matchId)
    .single()

  if (!match) throw new Error("Partida não encontrada.")

  // Start match if scheduled
  if (match.status === 'scheduled') {
    await supabase
      .from('matches')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', matchId)
      
    await supabase
      .from('game_tables')
      .update({ status: 'occupied' })
      .eq('id', tableId)
  }

  // Generate secure token
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')

  // Create session (valid for 12 hours)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 12)

  await supabase
    .from('match_sessions')
    .insert({
      match_id: matchId,
      table_id: tableId,
      role: 'CONTROL',
      session_token_hash: tokenHash,
      status: 'active',
      expires_at: expiresAt.toISOString()
    })

  return { success: true, tokenHash }
}

export async function registerPoint(matchId: string, teamId: string, points: number, tokenHash: string, deviceId: string) {
  try {
    await requireTenant()
    const supabase = await createClient()
    
    const { data, error } = await supabase.rpc('register_match_event', {
      p_device_id: deviceId,
      p_event_type: 'point_scored',
      p_match_id: matchId,
      p_metadata: {},
      p_points_delta: points,
      p_session_token_hash: tokenHash,
      p_team_id: teamId
    })

    if (error) throw error
    return { success: true, state: data }
  } catch (error: unknown) {
    console.error("registerPoint Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

export async function undoLastPoint(matchId: string, tokenHash: string) {
  try {
    await requireTenant()
    const supabase = await createClient()
    
    const { data, error } = await supabase.rpc('undo_match_event', {
      p_match_id: matchId,
      p_session_token_hash: tokenHash
    })

    if (error) throw error
    return { success: true, state: data }
  } catch (error: unknown) {
    console.error("undoLastPoint Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}
