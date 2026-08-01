import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ChampionshipService } from "@/domains/championship/championship.service"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Users, Monitor, MonitorPlay, Activity } from "lucide-react"

export default async function ChampionshipDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  let championship
  try {
    const { tenantId } = await requireTenant()
    const supabase = await createClient()
    const service = new ChampionshipService(supabase)
    
    championship = await service.getChampionshipDetails(id, tenantId)
  } catch {
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

      <div className="mt-12">
        <h2 className="text-lg font-semibold text-white">Gerenciamento</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 opacity-60 transition-opacity hover:opacity-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
              <Users className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="mt-4 font-semibold text-white">Equipes e Jogadores</h3>
            <p className="mt-1 text-sm text-zinc-400">Gerencie as inscrições do torneio.</p>
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-zinc-950/80 opacity-100 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-white">
                Disponível na Próxima Fatia
              </span>
            </div>
          </div>

          <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 opacity-60 transition-opacity hover:opacity-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <MonitorPlay className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="mt-4 font-semibold text-white">Mesa 1</h3>
            <p className="mt-1 text-sm text-zinc-400">Acesse o painel do árbitro (QR Code).</p>
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-zinc-950/80 opacity-100 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-white">
                Disponível na Próxima Fatia
              </span>
            </div>
          </div>

          <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 opacity-60 transition-opacity hover:opacity-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Activity className="h-5 w-5 text-amber-400" />
            </div>
            <h3 className="mt-4 font-semibold text-white">Partidas</h3>
            <p className="mt-1 text-sm text-zinc-400">Acompanhe as chaves e andamento.</p>
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-zinc-950/80 opacity-100 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-white">
                Disponível na Próxima Fatia
              </span>
            </div>
          </div>

          <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 opacity-60 transition-opacity hover:opacity-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10">
              <Monitor className="h-5 w-5 text-rose-400" />
            </div>
            <h3 className="mt-4 font-semibold text-white">Telão (Public)</h3>
            <p className="mt-1 text-sm text-zinc-400">Abra o placar em tempo real.</p>
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-zinc-950/80 opacity-100 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-white">
                Disponível na Próxima Fatia
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
