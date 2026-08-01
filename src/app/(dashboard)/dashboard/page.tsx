import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ChampionshipService } from "@/domains/championship/championship.service"
import Link from "next/link"
import { Trophy, Plus, Settings2, PlayCircle } from "lucide-react"

export default async function DashboardPage() {
  const { tenantId, tenantName } = await requireTenant()
  const supabase = await createClient()
  const service = new ChampionshipService(supabase)
  
  const summary = await service.getDashboardSummary(tenantId)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
          <p className="mt-1 text-sm text-zinc-400">{tenantName}</p>
        </div>
        <Link
          href="/championships/new"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Novo Campeonato
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-indigo-500/10 p-3 text-indigo-400">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Total</p>
              <p className="text-2xl font-semibold text-white">{summary.total}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-400">
              <PlayCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Ativos</p>
              <p className="text-2xl font-semibold text-white">{summary.active}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-amber-500/10 p-3 text-amber-400">
              <Settings2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Rascunhos</p>
              <p className="text-2xl font-semibold text-white">{summary.draft}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Mais Recentes</h2>
        {summary.recent.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 border-dashed bg-zinc-900/50 p-12 text-center">
            <Trophy className="mx-auto h-12 w-12 text-zinc-700" />
            <h3 className="mt-4 text-sm font-semibold text-white">Nenhum campeonato ainda</h3>
            <p className="mt-1 text-sm text-zinc-400">Crie seu primeiro campeonato para começar.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
            <ul className="divide-y divide-zinc-800">
              {summary.recent.map((champ) => (
                <li key={champ.id}>
                  <Link
                    href={`/championships/${champ.id}`}
                    className="flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-white">{champ.name}</p>
                      <p className="text-sm text-zinc-400">
                        {champ.status === 'draft' ? 'Rascunho' : 'Ativo'} • {champ.format === 'one_table_demo' ? 'Mesa Única' : 'Eliminatório'}
                      </p>
                    </div>
                    <span className="text-zinc-500">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
