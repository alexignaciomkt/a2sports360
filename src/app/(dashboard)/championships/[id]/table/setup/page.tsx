import { requireTenant } from "@/lib/auth"
import { redirect } from "next/navigation"

/**
 * Rota legada: /championships/[id]/table/setup
 * Redireciona para /championships/[id]/arenas.
 * A criação de Resources é responsabilidade exclusiva da página /arenas.
 */
export default async function LegacyTableSetupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireTenant()

  redirect(`/championships/${id}/arenas`)
}
