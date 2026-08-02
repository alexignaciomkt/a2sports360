"use server"

import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function generateMatch(championshipId: string) {
  try {
    const { tenantId } = await requireTenant()
    const supabase = await createClient()

    // 1. Verify access
    const { data: champ, error: champError } = await supabase
      .from('championships')
      .select('id')
      .eq('id', championshipId)
      .eq('tenant_id', tenantId)
      .single()

    if (champError || !champ) throw new Error("Acesso negado.")

    // 2. Load the 2 teams
    const { data: teams } = await supabase
      .from('teams')
      .select('id')
      .eq('championship_id', championshipId)
      .order('created_at', { ascending: true })
      
    if (!teams || teams.length !== 2) throw new Error("É necessário exatamente duas duplas.")

    // 3. Load Table 1
    const { data: table } = await supabase
      .from('game_tables')
      .select('id, current_match_id')
      .eq('championship_id', championshipId)
      .eq('number', 1)
      .single()

    if (!table) throw new Error("A Mesa 1 não foi configurada.")

    // 4. Idempotency Check: if there's already an active match, just return success
    if (table.current_match_id) {
      return { success: true }
    }

    // Also check if any match exists for this championship (one table MVP only has 1 match)
    const { data: existingMatch } = await supabase
      .from('matches')
      .select('id')
      .eq('championship_id', championshipId)
      .single()

    let matchId = existingMatch?.id

    if (!matchId) {
      // Create new match
      const { data: newMatch, error: matchError } = await supabase
        .from('matches')
        .insert({
          championship_id: championshipId,
          table_id: table.id,
          team_a_id: teams[0].id,
          team_b_id: teams[1].id,
          team_a_score: 0,
          team_b_score: 0,
          status: 'scheduled'
        })
        .select()
        .single()
        
      if (matchError) throw matchError
      matchId = newMatch.id
    }

    // Link match to table
    await supabase
      .from('game_tables')
      .update({ current_match_id: matchId, status: 'occupied' })
      .eq('id', table.id)

    revalidatePath(`/championships/${championshipId}`)
    revalidatePath(`/championships/${championshipId}/match`)

    return { success: true }
  } catch (error: unknown) {
    console.error(error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao gerar confronto." }
  }
}
