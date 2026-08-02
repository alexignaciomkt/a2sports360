"use server"

import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const teamSchema = z.object({
  championshipId: z.string().uuid(),
  teamName: z.string().min(1, "O nome da dupla é obrigatório"),
  player1Name: z.string().min(1, "Nome do jogador 1 é obrigatório"),
  player1Phone: z.string().optional(),
  player2Name: z.string().min(1, "Nome do jogador 2 é obrigatório"),
  player2Phone: z.string().optional(),
})

export async function createTeam(formData: FormData) {
  try {
    const { tenantId } = await requireTenant()
    const supabase = await createClient()

    const rawData = {
      championshipId: formData.get("championshipId") as string,
      teamName: formData.get("teamName") as string,
      player1Name: formData.get("player1Name") as string,
      player1Phone: formData.get("player1Phone") as string,
      player2Name: formData.get("player2Name") as string,
      player2Phone: formData.get("player2Phone") as string,
    }

    const data = teamSchema.parse(rawData)

    // Check if championship belongs to tenant
    const { data: champ, error: champError } = await supabase
      .from('championships')
      .select('id')
      .eq('id', data.championshipId)
      .eq('tenant_id', tenantId)
      .single()

    if (champError || !champ) {
      throw new Error("Campeonato não encontrado ou sem acesso.")
    }

    // Check how many teams already exist (max 2 for this sprint)
    const { count } = await supabase
      .from('teams')
      .select('id', { count: 'exact', head: true })
      .eq('championship_id', data.championshipId)

    if (count && count >= 2) {
      throw new Error("Limite de 2 duplas atingido para a Mesa Única.")
    }

    // 1. Create Team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        championship_id: data.championshipId,
        name: data.teamName,
        status: 'approved'
      })
      .select()
      .single()

    if (teamError) throw teamError;

    // 2. Create Players
    const { data: p1, error: p1Error } = await supabase
      .from('players')
      .insert({ name: data.player1Name, phone: data.player1Phone })
      .select().single()

    const { data: p2, error: p2Error } = await supabase
      .from('players')
      .insert({ name: data.player2Name, phone: data.player2Phone })
      .select().single()

    if (p1Error || p2Error) throw new Error("Erro ao criar jogadores.")

    // 3. Link Players to Team
    await supabase.from('team_players').insert([
      { team_id: team.id, player_id: p1.id, position: 1 },
      { team_id: team.id, player_id: p2.id, position: 2 }
    ])

    revalidatePath(`/championships/${data.championshipId}`)
    revalidatePath(`/championships/${data.championshipId}/teams`)

    return { success: true }
  } catch (error: unknown) {
    console.error(error)
    return { success: false, error: error instanceof Error ? error.message : "Ocorreu um erro ao cadastrar a dupla." }
  }
}
