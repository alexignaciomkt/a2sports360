import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { ResourceService } from "@/domains/resource/resource.service"

/**
 * Rota legada: /championships/[id]/table/1
 * Resolve o Resource por number=1 e redireciona para a rota canônica.
 * Nenhuma lógica de sessão ou UI permanece aqui.
 */
export default async function LegacyTable1Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireTenant()
  const supabase = await createClient()

  const resourceService = new ResourceService(supabase)
  const resource = await resourceService.getResourceByNumber(id, 1)

  if (!resource) notFound()

  redirect(`/championships/${id}/resources/${resource.id}/control`)
}
