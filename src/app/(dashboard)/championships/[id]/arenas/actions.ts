"use server"

import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ResourceService } from "@/domains/resource/resource.service"
import { ResourceType } from "@/domains/resource/resource.types"
import { revalidatePath } from "next/cache"

export async function configureArenas(
  championshipId: string,
  resourceType: ResourceType,
  prefix: string,
  quantity: number
) {
  try {
    const { tenantId } = await requireTenant()
    const supabase = await createClient()
    const resourceService = new ResourceService(supabase)

    const result = await resourceService.configureResources(
      tenantId,
      championshipId,
      resourceType,
      prefix,
      quantity
    )

    revalidatePath(`/championships/${championshipId}`)
    revalidatePath(`/championships/${championshipId}/arenas`)

    return {
      success: true,
      data: result,
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao configurar arenas",
    }
  }
}

export async function createSingleResource(
  championshipId: string,
  name: string,
  type: ResourceType,
  order: number
) {
  try {
    const { tenantId } = await requireTenant()
    const supabase = await createClient()
    const resourceService = new ResourceService(supabase)

    const result = await resourceService.createResource(
      tenantId,
      championshipId,
      name,
      type,
      order
    )

    revalidatePath(`/championships/${championshipId}`)
    revalidatePath(`/championships/${championshipId}/arenas`)

    return {
      success: true,
      data: result,
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao criar local",
    }
  }
}
