"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ChampionshipService } from "@/domains/championship/championship.service"
import { createChampionshipSchema } from "@/domains/championship/championship.schema"

export async function createChampionshipAction(formData: FormData) {
  try {
    // 1. Resolve Auth and Tenant securely
    const { tenantId } = await requireTenant()

    // 2. Validate input
    const payload = {
      name: formData.get("name"),
      modality: formData.get("modality"),
      format: formData.get("format"),
      target_score: formData.get("target_score"),
    }

    const validated = createChampionshipSchema.safeParse(payload)

    if (!validated.success) {
      return {
        error: "Dados inválidos: " + validated.error.issues.map(e => e.message).join(", ")
      }
    }

    // 3. Call service
    const supabase = await createClient()
    const service = new ChampionshipService(supabase)
    
    await service.createChampionship(validated.data, tenantId)

    // 4. Revalidate and redirect
    revalidatePath("/dashboard")
    revalidatePath("/championships")
  } catch (err: unknown) {
    console.error("Action createChampionshipAction error:", err)
    return { error: "Ocorreu um erro ao criar o campeonato. Tente novamente." }
  }

  // Redirect outside try-catch to avoid swallowing NEXT_REDIRECT
  redirect("/championships")
}
