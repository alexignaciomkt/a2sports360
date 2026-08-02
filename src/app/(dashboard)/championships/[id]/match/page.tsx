import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Swords } from "lucide-react"
import { GenerateMatchButton } from "./generate-match-button"

export default async function MatchPage({
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

  // Get Table 1 and current match
  const { data: table } = await supabase
    .from('game_tables')
    .select('id, current_match_id')
    .eq('championship_id', id)
    .eq('number', 1)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let match: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let teamA: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let teamB: any = null;

  if (table?.current_match_id) {
    const { data: matchData } = await supabase
      .from('matches')
      .select('*')
      .eq('id', table.current_match_id)
      .single()
    
    match = matchData;
    
    if (match) {
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name')
        .in('id', [match.team_a_id, match.team_b_id])
      
      teamA = teams?.find(t => t.id === match.team_a_id)
      teamB = teams?.find(t => t.id === match.team_b_id)
    }
  } else {
    // If no match yet, grab the two teams to show preview
    const { data: teams } = await supabase
      .from('teams')
      .select('id, name')
      .eq('championship_id', id)
      .order('created_at', { ascending: true })
      
    if (teams && teams.length === 2) {
      teamA = teams[0]
      teamB = teams[1]
    }
  }

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
          Confronto: {championship.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Gerencie o confronto oficial da Mesa 1.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        {!teamA || !teamB ? (
          <p className="text-zinc-500">As duas duplas ainda não foram cadastradas.</p>
        ) : (
          <div>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-right">
                <span className="block text-sm text-zinc-500 uppercase tracking-wider">Dupla A</span>
                <span className="block text-2xl font-bold text-white mt-2">{teamA.name}</span>
                {match && <span className="block text-4xl font-black text-indigo-500 mt-4">{match.team_a_score}</span>}
              </div>
              
              <div className="flex flex-col items-center justify-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                  <Swords className="h-6 w-6 text-zinc-400" />
                </div>
                <span className="mt-2 text-sm font-medium text-zinc-500">VS</span>
              </div>
              
              <div className="text-left">
                <span className="block text-sm text-zinc-500 uppercase tracking-wider">Dupla B</span>
                <span className="block text-2xl font-bold text-white mt-2">{teamB.name}</span>
                {match && <span className="block text-4xl font-black text-indigo-500 mt-4">{match.team_b_score}</span>}
              </div>
            </div>

            <div className="mt-12">
              {!match ? (
                <GenerateMatchButton championshipId={id} />
              ) : (
                <div className="space-y-4">
                  <div className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-500">
                    Status: {match.status === 'scheduled' ? 'Agendado' : (match.status === 'in_progress' ? 'Em andamento' : 'Finalizado')}
                  </div>
                  <div>
                    {match.status !== 'finished' ? (
                      <Link
                        href={`/championships/${id}/table/1`}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-8 py-4 text-lg font-semibold text-white hover:bg-emerald-400"
                      >
                        {match.status === 'scheduled' ? 'Iniciar Partida (Abrir Placar)' : 'Retomar Partida (Abrir Placar)'}
                      </Link>
                    ) : (
                      <div className="mt-6 text-xl font-bold text-emerald-400">
                        Vencedor: {match.winner_team_id === teamA.id ? teamA.name : teamB.name}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
