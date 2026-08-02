import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Trophy } from "lucide-react"

export default async function ChampionshipResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { tenantId } = await requireTenant()
  const supabase = await createClient()
  
  // Verify access
  const { data: championship } = await supabase
    .from('championships')
    .select('id, name')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()
    
  if (!championship) notFound()

  // Find the single match for the MVP
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('championship_id', id)
    .single()

  if (!match || match.status !== 'finished' || !match.winner_team_id) {
    return (
      <div className="space-y-8">
        <div>
          <Link
            href={`/championships/${id}`}
            className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar para Jornada
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Resultados: {championship.name}
          </h1>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
          A partida ainda não foi finalizada.
        </div>
      </div>
    )
  }

  // Load teams
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .in('id', [match.team_a_id, match.team_b_id])
    
  const teamA = teams?.find(t => t.id === match.team_a_id)
  const teamB = teams?.find(t => t.id === match.team_b_id)
  const winnerName = match.winner_team_id === match.team_a_id ? teamA?.name : teamB?.name;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/championships/${id}`}
          className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar para Jornada
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
          Resultados: {championship.name}
        </h1>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/50 bg-rose-500/10 p-12 text-center shadow-[0_0_15px_rgba(244,63,94,0.1)]">
        <Trophy className="h-20 w-20 text-rose-500" />
        <h2 className="mt-6 text-2xl font-bold text-white">Grande Vencedor</h2>
        <p className="mt-4 text-5xl font-black text-rose-400 uppercase tracking-widest">{winnerName}</p>
        
        <div className="mt-12 flex w-full max-w-md items-center justify-between rounded-lg bg-zinc-900/50 p-6 border border-zinc-800">
          <div className="text-center">
            <span className="block text-sm font-medium text-zinc-500 uppercase">{teamA?.name}</span>
            <span className="block text-3xl font-bold text-white">{match.team_a_score}</span>
          </div>
          <div className="text-zinc-600 font-bold">X</div>
          <div className="text-center">
            <span className="block text-sm font-medium text-zinc-500 uppercase">{teamB?.name}</span>
            <span className="block text-3xl font-bold text-white">{match.team_b_score}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
