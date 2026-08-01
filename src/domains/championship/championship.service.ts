import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/types/database.types"
import { ChampionshipRepository } from "./championship.repository"
import { CreateChampionshipData } from "./championship.schema"

export class ChampionshipService {
  private repository: ChampionshipRepository

  constructor(supabase: SupabaseClient<Database>) {
    this.repository = new ChampionshipRepository(supabase)
  }

  async getDashboardSummary(tenantId: string) {
    const championships = await this.repository.findByTenant(tenantId)

    const total = championships.length
    const draft = championships.filter((c) => c.status === "draft").length
    const active = championships.filter((c) => c.status === "in_progress").length

    return {
      total,
      draft,
      active,
      recent: championships.slice(0, 5),
    }
  }

  async listChampionships(tenantId: string) {
    return this.repository.findByTenant(tenantId)
  }

  async getChampionshipDetails(id: string, tenantId: string) {
    const championship = await this.repository.findByIdAndTenant(id, tenantId)
    if (!championship) {
      throw new Error("Campeonato não encontrado ou acesso negado.")
    }
    return championship
  }

  async createChampionship(data: CreateChampionshipData, tenantId: string) {
    // 1. Modality e target_score validados no Zod.
    // 2. Status draft garantido pela lógica.
    // 3. tenant_id resolvido no servidor passado como argumento seguro.

    return this.repository.create({
      name: data.name,
      modality: String(data.modality),
      format: data.format,
      target_score: data.target_score,
      status: "draft",
      tenant_id: tenantId,
      external_event_id: null,
    })
  }
}
