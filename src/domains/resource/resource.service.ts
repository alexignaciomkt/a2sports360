import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/types/database.types"
import { ResourceRepository } from "./resource.repository"
import { GameResource, ResourceOperationalSnapshot } from "./resource.types"

export class ResourceService {
  private repository: ResourceRepository

  constructor(supabase: SupabaseClient<Database>) {
    this.repository = new ResourceRepository(supabase)
  }

  async getResource(resourceId: string, tenantId?: string): Promise<GameResource | null> {
    return this.repository.getResource(resourceId, tenantId)
  }

  async getResourceByNumber(championshipId: string, number: number): Promise<GameResource | null> {
    return this.repository.getResourceByNumber(championshipId, number)
  }

  async getResourcesByChampionship(championshipId: string, tenantId: string): Promise<GameResource[]> {
    return this.repository.getResourcesByChampionship(championshipId, tenantId)
  }

  async getAvailableResources(championshipId: string, tenantId: string): Promise<GameResource[]> {
    return this.repository.getAvailableResources(championshipId, tenantId)
  }

  async getCurrentEncounter(resourceId: string, tenantId: string): Promise<string | null> {
    const resource = await this.repository.getResource(resourceId, tenantId)
    return resource?.currentEncounterId || null
  }

  async getResourceOperationalSnapshot(resourceId: string, tenantId: string): Promise<ResourceOperationalSnapshot | null> {
    const resource = await this.repository.getResource(resourceId, tenantId)
    if (!resource) return null

    return {
      resource
    }
  }

  async configureResources(
    tenantId: string,
    championshipId: string,
    resourceType: import("./resource.types").ResourceType,
    prefix: string,
    quantity: number
  ) {
    return this.repository.configureResources(tenantId, championshipId, resourceType, prefix, quantity)
  }

  async createResource(
    tenantId: string,
    championshipId: string,
    name: string,
    type: import("./resource.types").ResourceType,
    order: number
  ): Promise<GameResource> {
    return this.repository.createResource(tenantId, championshipId, name, type, order)
  }
}
