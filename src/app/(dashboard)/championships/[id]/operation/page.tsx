import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ChampionshipService } from "@/domains/championship/championship.service"
import { OperationService } from "@/domains/operation/operation.service"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { DashboardClient } from "./dashboard-client"

export default async function OperationDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const { tenantId } = await requireTenant()
  const supabase = await createClient()
  
  const championshipService = new ChampionshipService(supabase)
  const championship = await championshipService.getChampionshipDetails(id, tenantId)
  
  if (!championship) {
    notFound()
  }

  const operationService = new OperationService(supabase)
  const initialSnapshot = await operationService.getOperationalSnapshot(tenantId, id)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/championships/${id}`}
          className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar para o Campeonato
        </Link>
        <div className="mt-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Central de Operações
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {championship.name}
          </p>
        </div>
      </div>

      <DashboardClient 
        championshipId={championship.id} 
        initialSnapshot={initialSnapshot} 
      />
    </div>
  )
}
