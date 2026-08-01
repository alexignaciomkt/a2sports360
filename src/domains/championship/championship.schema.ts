import { z } from "zod"
import { CHAMPIONSHIP_MODALITIES, CHAMPIONSHIP_FORMATS } from "./championship.constants"

export const createChampionshipSchema = z.object({
  name: z.string().min(3, "Nome do campeonato deve ter no mínimo 3 caracteres").max(100, "Nome muito longo"),
  modality: z.enum(CHAMPIONSHIP_MODALITIES),
  format: z.enum(CHAMPIONSHIP_FORMATS),
  target_score: z.coerce.number().int().min(1, "A pontuação final deve ser no mínimo 1").max(100, "Pontuação final não deve exceder 100").default(12),
})

export type CreateChampionshipData = z.infer<typeof createChampionshipSchema>
