import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Swords, AlertTriangle, CheckCircle2 } from "lucide-react"
import { GenerateMatchButton } from "./generate-match-button"
import { OperationService } from "@/domains/operation/operation.service"
import { DispatchMatchButton } from "./dispatch-match-button"
import { ResolveMatchButton } from "./resolve-match-button"
import { ResourceService } from "@/domains/resource/resource.service"

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

  // Get Settings (Rules)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: settings } = await (supabase.from as any)('championship_settings')
    .select('*')
    .eq('championship_id', id)
    .single()

  // Get Encounter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: encounter } = await (supabase.from as any)('encounters')
    .select(`
      *,
      team_a:teams!encounters_team_a_id_fkey(name),
      team_b:teams!encounters_team_b_id_fkey(name)
    `)
    .eq('championship_id', id)
    .single()

  // Get Games (Matches)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let games: any[] = []
  if (encounter) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: matchData } = await (supabase.from as any)('matches')
      .select('*')
      .eq('encounter_id', encounter.id)
      .order('game_number', { ascending: true })
    if (matchData) games = matchData
  }

  // Get active resource for Operation Engine
  const resourceService = new ResourceService(supabase)
  const resources = await resourceService.getResourcesByChampionship(id, tenantId)
  const table = resources.length > 0 ? resources[0] : null

  // Check Teams for Generation
  const { count: teamCount } = await supabase
    .from('teams')
    .select('id', { count: 'exact', head: true })
    .eq('championship_id', id)

  const canGenerate = teamCount === 2 && settings?.format === 'direct_match'

  // Operation Context
  let context = null
  if (table) {
    const engine = new OperationService(supabase)
    context = await engine.getTableOperationalContext({
      tenantId,
      championshipId: id,
      tableId: table.id
    })
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
          Inspeção de Torneio: {championship.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Gerenciamento da Estrutura Esportiva (Tournament Engine)
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        {!encounter ? (
          // SEM ESTRUTURA GERADA
          <div className="flex flex-col items-center space-y-6">
            <h2 className="text-xl font-bold text-white">Nenhum Confronto Gerado</h2>
            
            {settings ? (
              <div className="bg-zinc-800/50 p-6 rounded-lg text-left max-w-md w-full">
                <h3 className="text-zinc-400 text-sm font-semibold uppercase tracking-wider mb-4">Resumo das Regras</h3>
                <ul className="space-y-2 text-zinc-300">
                  <li><strong>Formato:</strong> {settings.format === 'direct_match' ? 'Confronto Direto' : settings.format}</li>
                  <li><strong>Série:</strong> Melhor de {settings.best_of}</li>
                  <li><strong>Quedas até:</strong> {settings.target_score} pontos</li>
                </ul>
              </div>
            ) : (
              <p className="text-amber-500">A configuração esportiva não foi concluída.</p>
            )}

            {canGenerate ? (
              <GenerateMatchButton championshipId={id} />
            ) : (
              <p className="text-zinc-500">
                {!settings ? "Conclua a configuração esportiva." : "É necessário ter exatamente 2 equipes para gerar o confronto direto."}
              </p>
            )}
          </div>
        ) : (
          // ESTRUTURA GERADA
          <div>
            <div className="mb-4">
              <span className="inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                Confronto Direto
              </span>
            </div>
            
            <div className="flex items-center justify-center space-x-8 mb-8">
              <div className="text-right w-1/3">
                <span className="block text-2xl font-bold text-white">{encounter.team_a.name}</span>
                <span className="block text-5xl font-black text-indigo-500 mt-2">{encounter.team_a_wins}</span>
              </div>
              
              <div className="flex flex-col items-center justify-center px-4 w-1/3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                  <Swords className="h-6 w-6 text-zinc-400" />
                </div>
                <span className="mt-2 text-sm font-medium text-zinc-500">VS</span>
              </div>
              
              <div className="text-left w-1/3">
                <span className="block text-2xl font-bold text-white">{encounter.team_b.name}</span>
                <span className="block text-5xl font-black text-indigo-500 mt-2">{encounter.team_b_wins}</span>
              </div>
            </div>

            <div className="bg-zinc-800/30 rounded-lg p-4 max-w-lg mx-auto mb-10 text-zinc-400">
              <p>Melhor de {encounter.best_of} — Vence quem ganhar {encounter.wins_required} {encounter.wins_required === 1 ? 'queda' : 'quedas'}</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
              <h3 className="text-lg font-semibold text-white text-left border-b border-zinc-800 pb-2">Quedas Físicas (Games)</h3>
              
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {games.map((g: any) => (
                <div key={g.id} className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
                  <div className="flex items-center space-x-4">
                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold">
                      {g.game_number}
                    </div>
                    <span className="text-white font-medium">Queda {g.game_number}</span>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    {(g.status === 'in_progress' || g.status === 'finished') && (
                      <span className="text-lg font-mono text-white">
                        {g.team_a_score} x {g.team_b_score}
                      </span>
                    )}
                    
                    <span className={`text-sm font-medium px-2 py-1 rounded-md ${
                      g.status === 'scheduled' ? 'bg-zinc-800 text-zinc-400' : 
                      g.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {g.status === 'scheduled' ? 'Aguardando' : 
                       g.status === 'in_progress' ? 'Em andamento' : 
                       'Finalizada'}
                    </span>
                    
                    {g.status === 'finished' && !g.resolved_at && encounter.status === 'in_progress' && (
                      <ResolveMatchButton 
                        championshipId={id}
                        encounterId={encounter.id}
                        matchId={g.id}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Integration with Operation Engine if Table exists */}
            {table && context && (
              <div className="mt-12 pt-8 border-t border-zinc-800/50 max-w-2xl mx-auto">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-6 text-left">Motor Operacional ({table.displayName})</h3>
                
                {context.action === 'intervention_required' && (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <p className="text-zinc-400">{context.message}</p>
                  </div>
                )}

                {context.action === 'dispatch' && context.state === 'table_available_encounter_waiting' && (
                  <div className="flex items-center justify-between p-6 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
                    <div className="text-left">
                      <p className="font-semibold text-white">Ação Pendente</p>
                      <p className="text-sm text-zinc-400">{context.message}</p>
                    </div>
                    <DispatchMatchButton 
                      championshipId={id} 
                      encounterId={context.nextEncounterId} 
                      tableId={table.id}
                      placeName={table.displayName}
                    />
                  </div>
                )}

                {context.action === 'resume' && context.state === 'encounter_in_progress' && (
                  <div className="flex items-center justify-between p-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <div className="text-left">
                      <p className="font-semibold text-white">Confronto Ativo no Local</p>
                      <p className="text-sm text-zinc-400">Controle o placar da queda atual.</p>
                    </div>
                    <Link
                      href={`/championships/${id}/resources/${table.id}/control`}
                      className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
                    >
                      Retomar Controle
                    </Link>
                  </div>
                )}
                
                {context.action === 'wait' && (
                  <div className="flex items-center justify-center p-4">
                    <p className="text-zinc-500 text-sm flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {table.displayName} livre. Nenhuma queda aguardando.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
