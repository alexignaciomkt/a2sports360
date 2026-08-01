import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { IntegrationCreateChampionshipPayload, IntegrationCreateChampionshipResponse } from "./integration.types";
import { IntegrationRepository } from "./integration.repository";

export class IntegrationService {
  private repository: IntegrationRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.repository = new IntegrationRepository(supabase);
  }

  async createChampionship(
    payload: IntegrationCreateChampionshipPayload
  ): Promise<{ status: number; data: IntegrationCreateChampionshipResponse }> {
    // 1. Resolver Tenant
    const tenantId = await this.repository.resolveTenant(
      payload.source_system,
      payload.tenant_external_id
    );

    if (!tenantId) {
      return {
        status: 404,
        data: {
          success: false,
          code: "TENANT_MAPPING_NOT_FOUND",
          message: "O tenant não foi encontrado para as credenciais fornecidas.",
        },
      };
    }

    // 2. Inserir ou Idempotência
    try {
      const created = await this.repository.createChampionship(tenantId, payload);
      return {
        status: 201,
        data: {
          success: true,
          championship_id: created.id,
          message: "Campeonato criado com sucesso.",
        },
      };
    } catch (error: unknown) {
      // Postgres unique constraint violation is 23505
      const err = error as { code?: string };
      if (err?.code === "23505") {
        const existing = await this.repository.getChampionshipByExternalId(
          payload.source_system,
          payload.external_event_id
        );

        if (!existing) {
          return {
            status: 500,
            data: {
              success: false,
              code: "UNKNOWN_ERROR",
              message: "Conflito detectado, mas campeonato não pôde ser recuperado.",
            },
          };
        }

        // Check if existing championship has compatible payload data
        // For idempotency we just check if it was created under the same tenant and modality
        if (
          existing.tenant_id !== tenantId ||
          existing.modality !== payload.modality ||
          existing.format !== payload.format ||
          existing.target_score !== payload.target_score
        ) {
          return {
            status: 409,
            data: {
              success: false,
              code: "EXTERNAL_EVENT_CONFLICT",
              message: "Um campeonato já existe com esse identificador, mas com propriedades diferentes.",
            },
          };
        }

        return {
          status: 200, // Idempotent success
          data: {
            success: true,
            championship_id: existing.id,
            message: "Campeonato já existente retornado (Idempotência).",
          },
        };
      }

      console.error("IntegrationService create error:", error);
      return {
        status: 500,
        data: {
          success: false,
          code: "INTERNAL_ERROR",
          message: "Erro interno ao processar a criação do campeonato.",
        },
      };
    }
  }
}
