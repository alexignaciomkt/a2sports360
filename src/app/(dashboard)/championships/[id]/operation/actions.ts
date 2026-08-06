'use server'

import { createClient } from "@/lib/supabase/server"
import { requireTenant } from "@/lib/auth"
import { OperationService } from "@/domains/operation/operation.service"
import { OperationalDashboardSnapshot, DispatchQueueResult } from "@/domains/operation/operation.types"

export async function fetchDashboardSnapshot(championshipId: string): Promise<OperationalDashboardSnapshot> {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()
  const operationService = new OperationService(supabase)
  
  return operationService.getOperationalSnapshot(tenantId, championshipId)
}

export async function autoDispatch(championshipId: string): Promise<DispatchQueueResult> {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()
  const operationService = new OperationService(supabase)
  
  return operationService.processQueue(tenantId, championshipId)
}

export async function manualDispatch(championshipId: string, encounterId: string, resourceId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const { tenantId } = await requireTenant()
    const supabase = await createClient()
    const operationService = new OperationService(supabase)
    
    await operationService.dispatchEncounter(tenantId, championshipId, encounterId, resourceId)
    return { success: true }
  } catch (error) {
    console.error("Failed to manual dispatch:", error)
    return { success: false, message: error instanceof Error ? error.message : "Falha ao despachar confronto manualmente." }
  }
}
