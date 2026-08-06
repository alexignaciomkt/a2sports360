import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/types/database.types"
import { GameResource, ResourceStatus, ResourceType, ConfigureResourcesResult } from "./resource.types"

export class ResourceRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToGameResource(table: any): GameResource {
    return {
      id: table.id,
      tenantId: table.tenant_id,
      championshipId: table.championship_id,
      displayName: table.display_name,
      displayOrder: table.display_order,
      prefixGroup: table.prefix_group,
      number: table.number,
      type: (table.resource_type as ResourceType) || "TABLE",
      status: (table.status as ResourceStatus) || "available",
      currentEncounterId: table.current_encounter_id || null,
      activeGameId: table.current_match_id || null,
      createdAt: table.created_at,
      updatedAt: table.updated_at
    }
  }

  async getResource(resourceId: string, tenantId?: string): Promise<GameResource | null> {
    let query = this.supabase
      .from('game_tables')
      .select('*')
      .eq('id', resourceId)

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    const { data } = await query.single()

    if (!data) return null
    return this.mapToGameResource(data)
  }

  async getResourceByNumber(championshipId: string, number: number): Promise<GameResource | null> {
    const { data } = await this.supabase
      .from('game_tables')
      .select('*')
      .eq('championship_id', championshipId)
      .eq('number', number)
      .single()

    if (!data) return null
    return this.mapToGameResource(data)
  }

  async getResourcesByChampionship(championshipId: string, tenantId: string): Promise<GameResource[]> {
    const { data, error } = await this.supabase
      .from("game_tables")
      .select("*")
      .eq("championship_id", championshipId)
      .eq("tenant_id", tenantId)
      .order("display_order", { ascending: true })

    if (error || !data) return []
    return data.map((t) => this.mapToGameResource(t))
  }

  async getAvailableResources(championshipId: string, tenantId: string): Promise<GameResource[]> {
    const { data, error } = await this.supabase
      .from("game_tables")
      .select("*")
      .eq("championship_id", championshipId)
      .eq("tenant_id", tenantId)
      .eq("status", "available")
      .is("current_encounter_id", null)
      .order("display_order", { ascending: true })

    if (error || !data) return []
    return data.map((t) => this.mapToGameResource(t))
  }

  async configureResources(
    tenantId: string,
    championshipId: string,
    resourceType: ResourceType,
    prefix: string,
    quantity: number
  ): Promise<ConfigureResourcesResult> {
    const { data, error } = await this.supabase.rpc("configure_championship_resources", {
      p_tenant_id: tenantId,
      p_championship_id: championshipId,
      p_resource_type: resourceType,
      p_prefix: prefix,
      p_quantity: quantity,
    })

    if (error) {
      throw new Error(`Failed to configure resources: ${error.message}`)
    }

    return data as unknown as ConfigureResourcesResult
  }

  async createResource(
    tenantId: string,
    championshipId: string,
    name: string,
    type: ResourceType,
    order: number
  ): Promise<GameResource> {
    const { randomBytes } = await import("crypto")
    const qrToken = randomBytes(16).toString("hex")

    // Get next global number
    const { data: maxNumberData } = await this.supabase
      .from("game_tables")
      .select("number")
      .eq("championship_id", championshipId)
      .order("number", { ascending: false })
      .limit(1)
      .single()

    const nextNumber = maxNumberData ? maxNumberData.number + 1 : 1

    const { data, error } = await this.supabase
      .from("game_tables")
      .insert({
        tenant_id: tenantId,
        championship_id: championshipId,
        number: nextNumber,
        qr_token: qrToken,
        status: "available",
        resource_type: type,
        display_name: name,
        display_order: order,
        prefix_group: name // Manual mode uses name as prefix
      })
      .select()
      .single()

    if (error || !data) {
      throw new Error(`Failed to create resource: ${error?.message}`)
    }

    return this.mapToGameResource(data)
  }
}
