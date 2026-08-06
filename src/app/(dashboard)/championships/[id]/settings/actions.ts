"use server"

import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const sportsConfigSchema = z.object({
  championshipId: z.string().uuid(),
  sport: z.literal("truco"),
  format: z.literal("direct_match"),
  best_of: z.coerce.number().int().min(1),
  target_score: z.coerce.number().int().min(1),
  draw_allowed: z.boolean(),
  tie_break_rule: z.string().optional(),
  wo_timeout_minutes: z.coerce.number().int().min(0),
})

export async function saveChampionshipSettings(formData: FormData) {
  try {
    const { tenantId } = await requireTenant()
    const supabase = await createClient()

    const rawData = {
      championshipId: formData.get("championshipId") as string,
      sport: formData.get("sport") as string,
      format: formData.get("format") as string,
      best_of: formData.get("best_of"),
      target_score: formData.get("target_score"),
      draw_allowed: formData.get("draw_allowed") === "true",
      tie_break_rule: formData.get("tie_break_rule") as string || undefined,
      wo_timeout_minutes: formData.get("wo_timeout_minutes"),
    }

    const data = sportsConfigSchema.parse(rawData)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('configure_championship_sports', {
      p_championship_id: data.championshipId,
      p_tenant_id: tenantId,
      p_sport: data.sport,
      p_format: data.format,
      p_best_of: data.best_of,
      p_target_score: data.target_score,
      p_draw_allowed: data.draw_allowed,
      p_tie_break_rule: data.tie_break_rule || null,
      p_wo_timeout_minutes: data.wo_timeout_minutes
    })

    if (error) throw error

    revalidatePath(`/championships/${data.championshipId}`)
    revalidatePath(`/championships/${data.championshipId}/settings`)

    return { success: true }
  } catch (error: unknown) {
    console.error(error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}
