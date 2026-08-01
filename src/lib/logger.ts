export type StructuredLogParams = {
  request_id: string;
  source_system?: string;
  endpoint: string;
  external_event_id?: string;
  tenant_external_id?: string;
  status_code: number;
  success: boolean;
  duration_ms: number;
  ip: string | null;
  error_code?: string;
};

export function logStructuredInfo(params: StructuredLogParams) {
  // Format as a single-line JSON string for structured log aggregation
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    ...params
  }));
}
