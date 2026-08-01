import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/types/database.types"

type DbChampionshipInsert = Database["public"]["Tables"]["championships"]["Insert"]
export type DbChampionshipRow = Database["public"]["Tables"]["championships"]["Row"]

export class ChampionshipRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async create(data: DbChampionshipInsert) {
    const { data: championship, error } = await this.supabase
      .from("championships")
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar campeonato no banco:", error)
      throw new Error("Falha ao criar o campeonato. " + error.message)
    }

    return championship
  }

  async findByTenant(tenantId: string) {
    const { data: championships, error } = await this.supabase
      .from("championships")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao listar campeonatos no banco:", error)
      throw new Error("Falha ao listar campeonatos.")
    }

    return championships
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    const { data: championship, error } = await this.supabase
      .from("championships")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single()

    if (error) {
      return null
    }

    return championship
  }
}
