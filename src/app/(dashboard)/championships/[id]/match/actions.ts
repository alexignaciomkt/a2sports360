"use server"

import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { OperationService } from "@/domains/operation/operation.service"

export async function generateMatch(championshipId: string) {
  try {
    const { tenantId } = await requireTenant()
    const supabase = await createClient()

    // Tournament Command: gerar chaveamento
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('generate_direct_match_tournament', {
      p_championship_id: championshipId,
      p_tenant_id: tenantId
    })

    if (rpcError) throw rpcError

    // Gatilho: Operation Engine processa a fila após Tournament Command.
    // Se falhar, o chaveamento já está confirmado. Retry é idempotente.
    let queueResult = null
    try {
      const engine = new OperationService(supabase)
      queueResult = await engine.processQueue(tenantId, championshipId)
    } catch (queueError) {
      console.error('[Operation Engine] Falha ao processar fila após Tournament:', queueError)
    }

    revalidatePath(`/championships/${championshipId}`)
    revalidatePath(`/championships/${championshipId}/match`)

    return { success: true, data: rpcData, queueResult }
  } catch (error: unknown) {
    console.error(error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao gerar confronto." }
  }
}

export async function dispatchMatch(championshipId: string, encounterId: string, tableId: string) {
  try {
    const { tenantId } = await requireTenant()
    const supabase = await createClient()
    const engine = new OperationService(supabase)
    
    await engine.dispatchEncounter(tenantId, championshipId, encounterId, tableId)

    revalidatePath(`/championships/${championshipId}/match`)
    return { success: true }
  } catch (error: unknown) {
    console.error(error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao despachar partida." }
  }
}

export async function resolveMatch(championshipId: string, encounterId: string, matchId: string) {
  try {
    const { tenantId } = await requireTenant()
    const supabase = await createClient()
    const { ResolutionService } = await import("@/domains/resolution/resolution.service")
    const resolutionEngine = new ResolutionService(supabase)
    
    const result = await resolutionEngine.resolveFinishedGame(tenantId, championshipId, encounterId, matchId)

    // Gatilho: Operation Engine processa a fila após Resolution Command.
    // Se falhar, a resolução já está confirmada. Retry é idempotente.
    let queueResult = null
    if (result.outcome === 'encounter_finished') {
      try {
        const operationEngine = new OperationService(supabase)
        queueResult = await operationEngine.processQueue(tenantId, championshipId)
      } catch (queueError) {
        console.error('[Operation Engine] Falha ao processar fila após Resolution:', queueError)
      }
    }

    revalidatePath(`/championships/${championshipId}`)
    revalidatePath(`/championships/${championshipId}/match`)
    // Nota: revalidação do display público e do controle operacional
    // será feita quando as rotas forem parametrizadas por resourceId.
    
    return { success: true, outcome: result.outcome, queueResult }
  } catch (error: unknown) {
    console.error(error)
    return { success: false, error: error instanceof Error ? error.message : "Erro ao homologar a partida." }
  }
}
