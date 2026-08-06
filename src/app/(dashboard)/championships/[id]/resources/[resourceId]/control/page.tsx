import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, AlertTriangle, MapPin } from "lucide-react"
import { ScoreboardClient } from "./scoreboard-client"
import { ResourceService } from "@/domains/resource/resource.service"
import { cookies } from "next/headers"
import { createHash } from "crypto"

export default async function ResourceControlPage({
  params,
}: {
  params: Promise<{ id: string; resourceId: string }>
}) {
  const { id, resourceId } = await params

  // 1. Autenticação e Tenant
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  // 2. Validar Championship pertence ao tenant
  const { data: championship } = await supabase
    .from('championships')
    .select('id, name')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!championship) notFound()

  // 3. Validar Resource pertence ao tenant
  const resourceService = new ResourceService(supabase)
  const resource = await resourceService.getResource(resourceId, tenantId)

  if (!resource) notFound()

  // 4. Validar vínculo Resource → Championship
  if (resource.championshipId !== id) notFound()

  // 5. Estado: Local livre (sem match ativo)
  if (!resource.activeGameId) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-6rem)]">
        <div className="mb-4">
          <Link
            href={`/championships/${id}/operation`}
            className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar à Central de Operações
          </Link>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mb-6">
            <MapPin className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Local Livre</h1>
          <p className="text-zinc-400 max-w-md">
            <strong className="text-white">{resource.displayName}</strong> não possui nenhum confronto ativo no momento.
            Despache um confronto pela Central de Operações.
          </p>
          <Link
            href={`/championships/${id}/operation`}
            className="mt-8 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors inline-flex items-center"
          >
            Ir para Central de Operações
          </Link>
        </div>
      </div>
    )
  }

  // 6. Carregar Match atual (server-side, a partir do resource.activeGameId)
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', resource.activeGameId)
    .single()

  if (!match) {
    // Estado inconsistente: resource diz ter activeGameId mas match não existe
    return (
      <div className="flex flex-col min-h-[calc(100vh-6rem)]">
        <div className="mb-4">
          <Link
            href={`/championships/${id}/operation`}
            className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar à Central de Operações
          </Link>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 mb-6">
            <AlertTriangle className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-amber-500 mb-2">Estado Inconsistente</h1>
          <p className="text-zinc-400 max-w-md">
            O Local <strong className="text-white">{resource.displayName}</strong> indica um confronto ativo,
            mas os dados da partida não foram encontrados. Contacte o suporte.
          </p>
        </div>
      </div>
    )
  }

  // 7. Carregar equipes
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .in('id', [match.team_a_id, match.team_b_id])

  const teamA = teams?.find(t => t.id === match.team_a_id)
  const teamB = teams?.find(t => t.id === match.team_b_id)

  if (!teamA || !teamB) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-6rem)]">
        <div className="mb-4">
          <Link
            href={`/championships/${id}/operation`}
            className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar à Central de Operações
          </Link>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 mb-6">
            <AlertTriangle className="h-8 w-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-amber-500 mb-2">Estado Inconsistente</h1>
          <p className="text-zinc-400 max-w-md">
            Uma ou ambas as equipes não foram encontradas para este confronto.
          </p>
        </div>
      </div>
    )
  }

  // 8. Fetch target score
  const { data: settings } = await supabase.from('championship_settings')
    .select('target_score')
    .eq('championship_id', id)
    .single()

  const targetScore = settings?.target_score ?? 12

  // 9. Sessão operacional (Inspeção Apenas)
  let controlState: 'active' | 'missing' | 'occupied_by_another_session' | 'expired' | 'error' = 'missing'

  const cookieStore = await cookies()
  const token = cookieStore.get('a2sports_control_token')?.value
  
  const { data: activeSession } = await supabase
    .from('match_sessions')
    .select('session_token_hash')
    .eq('match_id', resource.activeGameId)
    .eq('role', 'CONTROL')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (activeSession) {
    if (token) {
      const tokenHash = createHash('sha256').update(token).digest('hex')
      if (tokenHash === activeSession.session_token_hash) {
        controlState = 'active'
      } else {
        controlState = 'occupied_by_another_session'
      }
    } else {
      controlState = 'occupied_by_another_session'
    }
  } else {
    controlState = 'missing'
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)]">
      <div className="mb-4">
        <Link
          href={`/championships/${id}/operation`}
          className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Sair do Controle
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <ScoreboardClient 
          matchId={resource.activeGameId}
          match={match}
          teamA={teamA}
          teamB={teamB}
          controlState={controlState}
          championshipId={championship.id}
          resourceId={resource.id}
          targetScore={targetScore}
          resourceDisplayName={resource.displayName || "Local Operacional"}
        />
      </div>
    </div>
  )
}
