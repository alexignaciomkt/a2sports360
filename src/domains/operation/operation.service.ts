import { OperationRepository } from "./operation.repository";
import { OperationContext, DispatchQueueResult, OperationalDashboardSnapshot, EncounterStatus } from "./operation.types";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { ResourceService } from "../resource/resource.service";

export class OperationService {
  private repository: OperationRepository;
  private resourceService: ResourceService;

  constructor(supabase: SupabaseClient<Database>) {
    this.repository = new OperationRepository(supabase);
    this.resourceService = new ResourceService(supabase);
  }

  /**
   * Avalia o contexto operacional de um Resource específico.
   * Retorna a ação recomendada para o organizador.
   */
  async getTableOperationalContext(params: {
    tenantId: string;
    championshipId: string;
    tableId: string;
  }): Promise<OperationContext> {
    const table = await this.resourceService.getResource(params.tableId, params.tenantId);

    if (!table) {
      return {
        state: 'inconsistent_state',
        action: 'intervention_required',
        message: 'Local de Jogo não encontrado no campeonato.'
      };
    }

    if (table.status === 'available') {
      if (table.currentEncounterId || table.activeGameId) {
        return {
          state: 'inconsistent_state',
          action: 'intervention_required',
          message: 'Local disponível mas possui confronto ou queda vinculada.'
        };
      }

      const nextEncounter = await this.repository.getNextScheduledEncounter(params.tenantId, params.championshipId);

      if (nextEncounter) {
        return {
          state: 'table_available_encounter_waiting',
          action: 'dispatch',
          nextEncounterId: nextEncounter.id,
          message: 'Próximo confronto pronto para despacho.'
        };
      } else {
        return {
          state: 'table_available_no_match',
          action: 'wait',
          message: 'Local livre — aguardando próximo confronto.'
        };
      }
    } else if (table.status === 'occupied') {
      if (!table.currentEncounterId || !table.activeGameId) {
        return {
          state: 'inconsistent_state',
          action: 'intervention_required',
          message: 'Local ocupado sem confronto ou queda ativa vinculada.'
        };
      }

      const currentEncounter = await this.repository.getEncounterById(table.currentEncounterId);
      if (!currentEncounter) {
        return {
          state: 'inconsistent_state',
          action: 'intervention_required',
          message: 'Confronto vinculado não encontrado.'
        };
      }

      if (currentEncounter.status === 'in_progress') {
        return {
          state: 'encounter_in_progress',
          action: 'resume',
          currentEncounterId: currentEncounter.id,
          activeGameId: table.activeGameId,
          message: 'Confronto em andamento.'
        };
      } else {
        return {
          state: 'inconsistent_state',
          action: 'intervention_required',
          message: `Confronto vinculado possui status inválido: ${currentEncounter.status}.`
        };
      }
    }

    return {
      state: 'inconsistent_state',
      action: 'intervention_required',
      message: 'Estado operacional desconhecido.'
    };
  }

  /**
   * Despacho manual unitário (fallback administrativo).
   */
  async dispatchEncounter(tenantId: string, championshipId: string, encounterId: string, resourceId: string) {
    return await this.repository.dispatchEncounterToResource(tenantId, championshipId, encounterId, resourceId);
  }

  /**
   * Processa a fila de despacho automático.
   * Pareia encounters scheduled com resources available.
   * Cada Command anterior (Tournament/Resolution) é autocontida.
   * Se processQueue falhar, o Command anterior não é revertido.
   */
  async processQueue(tenantId: string, championshipId: string): Promise<DispatchQueueResult> {
    return await this.repository.processDispatchQueue(tenantId, championshipId);
  }

  /**
   * Monta o snapshot operacional completo do campeonato.
   * Alimenta o futuro Dashboard Operacional.
   */
  async getOperationalSnapshot(tenantId: string, championshipId: string): Promise<OperationalDashboardSnapshot> {
    const [resources, encounterCounts, allEncounters] = await Promise.all([
      this.resourceService.getResourcesByChampionship(championshipId, tenantId),
      this.repository.getEncounterCounts(tenantId, championshipId),
      this.repository.getEncountersWithTeams(tenantId, championshipId, ['scheduled', 'in_progress']),
    ]);

    const availableResources = resources.filter(r => r.status === 'available' && !r.currentEncounterId);
    const occupiedResources = resources.filter(r => r.status === 'occupied');

    // Montar dispatches atuais a partir dos resources ocupados
    const currentDispatches = occupiedResources
      .filter(r => r.currentEncounterId && r.activeGameId)
      .map(r => ({
        encounter_id: r.currentEncounterId!,
        resource_id: r.id,
        resource_name: r.displayName,
        active_game_id: r.activeGameId!,
      }));

    return {
      totalResources: resources.length,
      availableResources: availableResources.length,
      occupiedResources: occupiedResources.length,
      scheduledEncounters: encounterCounts.scheduled,
      inProgressEncounters: encounterCounts.inProgress,
      finishedEncounters: encounterCounts.finished,
      currentDispatches: currentDispatches,
      waitingCount: encounterCounts.scheduled,
      resources: resources.map(r => ({
        id: r.id,
        displayName: r.displayName,
        status: r.status,
        currentEncounterId: r.currentEncounterId,
        activeGameId: r.activeGameId,
      })),
      waitingEncounters: allEncounters
        .filter(e => e.status === 'scheduled')
        .map(e => ({
          id: e.id,
          teamAName: e.team_a?.name || 'Aguardando',
          teamBName: e.team_b?.name || 'Aguardando',
          status: e.status as EncounterStatus,
        })),
      inProgressEncounterDetails: allEncounters
        .filter(e => e.status === 'in_progress')
        .map(e => ({
          id: e.id,
          teamAName: e.team_a?.name || 'Aguardando',
          teamBName: e.team_b?.name || 'Aguardando',
          status: e.status as EncounterStatus,
        })),
    };
  }
}
