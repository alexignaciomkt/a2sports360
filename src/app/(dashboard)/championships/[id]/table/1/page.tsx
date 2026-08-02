import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ensureControlSession } from "./actions"
import { ScoreboardClient } from "./scoreboard-client"

export default async function Table1ControlPage({
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

  if (!table || !table.current_match_id) {
    return (
      <div className="space-y-8 text-center p-12">
        <h1 className="text-2xl font-bold text-white">Nenhum confronto ativo</h1>
        <p className="text-zinc-400">Gere o confronto primeiro.</p>
        <Link href={`/championships/${id}/match`} className="text-indigo-400 hover:underline">Voltar</Link>
      </div>
    )
  }

  // Load teams
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', table.current_match_id)
    .single()
    
  if (!match) notFound()

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .in('id', [match.team_a_id, match.team_b_id])
    
  const teamA = teams?.find(t => t.id === match.team_a_id)
  const teamB = teams?.find(t => t.id === match.team_b_id)

  // Start match and create session
  const { tokenHash } = await ensureControlSession(match.id, table.id)

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)]">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/championships/${id}/match`}
          className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Sair do Controle
        </Link>
        <div className="text-sm font-semibold text-emerald-400 border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 rounded-full flex items-center">
          <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
          SESSÃO DE CONTROLE ATIVA
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <ScoreboardClient 
          match={match}
          teamA={teamA}
          teamB={teamB}
          tokenHash={tokenHash}
        />
      </div>
    </div>
  )
}
