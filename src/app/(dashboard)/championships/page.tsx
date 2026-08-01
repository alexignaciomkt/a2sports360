import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ChampionshipService } from "@/domains/championship/championship.service"
import Link from "next/link"
import { Plus, Trophy, Calendar } from "lucide-react"

export default async function ChampionshipsListPage() {
  const { tenantId } = await requireTenant()
  const supabase = await createClient()
  const service = new ChampionshipService(supabase)
  
  const championships = await service.listChampionships(tenantId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Campeonatos</h1>
          <p className="mt-1 text-sm text-zinc-400">Gerencie seus eventos esportivos</p>
        </div>
        <Link
          href="/championships/new"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Novo Campeonato
        </Link>
      </div>

      {championships.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-zinc-800 border-dashed bg-zinc-900/50 p-12 text-center">
          <div className="rounded-full bg-zinc-800 p-4">
            <Trophy className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">Nenhum campeonato criado ainda</h3>
          <p className="mt-2 text-sm text-zinc-400 max-w-sm mx-auto">
            Comece criando o seu primeiro campeonato para cadastrar as equipes e organizar as partidas.
          </p>
          <div className="mt-6">
            <Link
              href="/championships/new"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white"
            >
              Criar primeiro campeonato
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {championships.map((champ) => (
            <Link
              key={champ.id}
              href={`/championships/${champ.id}`}
              className="group flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 hover:bg-zinc-800/80 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${champ.status === 'draft' ? 'bg-zinc-400/10 text-zinc-400 ring-zinc-400/20' : 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20'}`}>
                    {champ.status === 'draft' ? 'Rascunho' : 'Ativo'}
                  </span>
                  <span className="text-xs text-zinc-500">
                    Pontos: {champ.target_score}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
                  {champ.name}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {champ.modality === 'truco_duplas' ? 'Truco em Duplas' : champ.modality}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {champ.format === 'one_table_demo' ? 'Mesa Única (Demonstração)' : 'Torneio Eliminatório'}
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs text-zinc-500">
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                Criado em {new Date(champ.created_at || '').toLocaleDateString('pt-BR')}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
