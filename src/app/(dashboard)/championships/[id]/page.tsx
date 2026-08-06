import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ChampionshipService } from "@/domains/championship/championship.service"
import { ResourceService } from "@/domains/resource/resource.service"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ChampionshipJourney } from "./components/championship-journey"

export default async function ChampionshipDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  let championship;
  let teamsCount = 0;
  let currentMatch = null;
  let settings = null;
  let hasPlaces = false;
  let firstResourceNumber: number | undefined;

  try {
    const { tenantId } = await requireTenant()
    const supabase = await createClient()
    const service = new ChampionshipService(supabase)
    
    championship = await service.getChampionshipDetails(id, tenantId)
    
    const { data: settingsData } = await supabase
      .from('championship_settings')
      .select('target_score')
      .eq('championship_id', id)
      .single();
    settings = settingsData;
    
    const { count: countTeams } = await supabase
      .from('teams')
      .select('id', { count: 'exact', head: true })
      .eq('championship_id', id);
    teamsCount = countTeams || 0;

    // Usar ResourceService em vez de acesso direto a game_tables (Repository Rule)
    const resourceService = new ResourceService(supabase)
    const resources = await resourceService.getResourcesByChampionship(id, tenantId)
    hasPlaces = resources.length > 0;

    if (resources.length > 0) {
      const firstResource = resources[0]
      firstResourceNumber = firstResource.number

      if (firstResource.activeGameId) {
        const { data: matchData } = await supabase
          .from('matches')
          .select('*')
          .eq('id', firstResource.activeGameId)
          .single();
        currentMatch = matchData;
      }
    }

  } catch (error) {
    console.error(error);
    notFound()
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/championships"
          className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar para Campeonatos
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {championship.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Criado em {new Date(championship.created_at || "").toLocaleDateString("pt-BR")}
            </p>
          </div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium ring-1 ring-inset ${championship.status === 'draft' ? 'bg-zinc-400/10 text-zinc-400 ring-zinc-400/20' : 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20'}`}>
            {championship.status === 'draft' ? 'Rascunho' : 'Ativo'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm font-medium text-zinc-400">Modalidade</p>
          <p className="mt-1 font-semibold text-white">
            {championship.modality === "truco_duplas" ? "Truco em Duplas" : championship.modality}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm font-medium text-zinc-400">Formato</p>
          <p className="mt-1 font-semibold text-white">
            {championship.format === "one_table_demo" ? "Mesa Única" : "Torneio Eliminatório"}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm font-medium text-zinc-400">Pontuação Final</p>
          <p className="mt-1 font-semibold text-white">
            {championship.target_score} pontos
          </p>
        </div>
        {championship.external_event_id && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-sm font-medium text-zinc-400">ID Evento Externo</p>
            <p className="mt-1 font-semibold text-white">
              {championship.external_event_id}
            </p>
          </div>
        )}
      </div>

      <ChampionshipJourney 
        championshipId={championship.id}
        teamsCount={teamsCount}
        currentMatch={currentMatch}
        settings={settings || { target_score: 12 }}
        hasPlaces={hasPlaces}
        firstResourceNumber={firstResourceNumber}
      />
    </div>
  )
}
