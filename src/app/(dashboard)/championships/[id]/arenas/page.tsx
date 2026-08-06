import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ArenasClient } from "./arenas-client"
import { ResourceService } from "@/domains/resource/resource.service"

export default async function ArenasPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { tenantId } = await requireTenant()
  const supabase = await createClient()
  const resourceService = new ResourceService(supabase)

  const { data: championship } = await supabase
    .from("championships")
    .select("id, name")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single()

  if (!championship) notFound()

  // Verify access and get target score setting
  const { data: settings } = await supabase.from('championship_settings')
    .select('sport')
    .eq('championship_id', id)
    .single()

  if (!settings) {
    // Should not happen if they follow the journey
    notFound()
  }

  const resources = await resourceService.getResourcesByChampionship(id, tenantId)

  return (
    <div className="flex h-full flex-col animate-in fade-in duration-500">
      <div className="mb-8">
        <Link
          href={`/championships/${id}`}
          className="inline-flex items-center text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Jornada
        </Link>
      </div>
      
      <main className="flex-1">
        <div className="mx-auto max-w-6xl space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Locais
            </h1>
            <p className="text-zinc-400 mt-1">
              Gerencie todos os locais onde os confrontos serão realizados.
            </p>
          </div>

          <ArenasClient 
            championshipId={id} 
            initialResources={resources}
          />
        </div>
      </main>
    </div>
  )
}
