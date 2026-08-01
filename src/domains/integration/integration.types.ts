export interface IntegrationCreateChampionshipPayload {
  source_system: string;
  external_event_id: string;
  tenant_external_id: string;
  organizer_external_id: string;
  organizer_name: string;
  championship_name: string;
  modality: string;
  format: string;
  target_score: number;
  starts_at?: string | null;
  metadata?: Record<string, unknown>;
}

export interface IntegrationCreateChampionshipResponse {
  success: boolean;
  championship_id?: string;
  message?: string;
  code?: string;
  request_id?: string;
}
