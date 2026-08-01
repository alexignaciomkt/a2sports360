import { z } from "zod";
import { CHAMPIONSHIP_MODALITIES, CHAMPIONSHIP_FORMATS } from "../championship/championship.constants";

export const integrationCreateChampionshipSchema = z.object({
  source_system: z.string().min(1),
  external_event_id: z.string().min(1),
  tenant_external_id: z.string().min(1),
  organizer_external_id: z.string().min(1),
  organizer_name: z.string().min(1),
  championship_name: z.string().min(3),
  modality: z.enum(CHAMPIONSHIP_MODALITIES),
  format: z.enum(CHAMPIONSHIP_FORMATS),
  target_score: z.number().int().min(1, "target_score deve ser no mínimo 1"),
  starts_at: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
