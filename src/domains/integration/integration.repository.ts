import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { IntegrationCreateChampionshipPayload } from "./integration.types";

export class IntegrationRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async resolveTenant(sourceSystem: string, externalId: string) {
    const { data, error } = await this.supabase
      .from("tenants")
      .select("id")
      .eq("external_source", sourceSystem)
      .eq("external_id", externalId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.id;
  }

  async getChampionshipByExternalId(sourceSystem: string, externalEventId: string) {
    const { data, error } = await this.supabase
      .from("championships")
      .select("id, name, modality, format, target_score, tenant_id")
      .eq("source_system", sourceSystem)
      .eq("external_event_id", externalEventId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  async createChampionship(tenantId: string, payload: IntegrationCreateChampionshipPayload) {
    const { data, error } = await this.supabase
      .from("championships")
      .insert({
        tenant_id: tenantId,
        source_system: payload.source_system,
        external_event_id: payload.external_event_id,
        name: payload.championship_name,
        modality: payload.modality,
        format: payload.format,
        target_score: payload.target_score,
        status: "DRAFT",
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
