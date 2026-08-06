import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, User, Phone, Play } from "lucide-react"
import { NewTeamButton } from "./new-team-button"

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const { tenantId } = await requireTenant()
  const supabase = await createClient()
  
  // Verify championship access
  const { data: championship } = await supabase
    .from('championships')
    .select('id, name')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()
    
  if (!championship) notFound()

  // Get current teams (isolar a busca principal para não ser ocultada por falha nos joins)
  const { data: teamsData, error: teamsError } = await supabase
    .from('teams')
    .select('id, name')
    .eq('championship_id', id)
    .order('name', { ascending: true })

  console.log("[teamsPage] championshipId", id)
  console.log("[teamsPage] teams encontrados", teamsData?.length, teamsError ? `ERRO: ${teamsError.message}` : '')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let teamPlayersData: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let playersData: any[] = []

  if (teamsData && teamsData.length > 0) {
    const teamIds = teamsData.map((t: { id: string }) => t.id)
    
    // Buscar vínculos (não quebra a página se falhar)
    const { data: tpData, error: tpError } = await supabase
      .from('team_players')
      .select('*')
      .in('team_id', teamIds)
      
    teamPlayersData = tpData || []
    console.log("[teamsPage] vínculos encontrados", teamPlayersData.length, tpError ? `ERRO: ${tpError.message}` : '')

    // Buscar jogadores
    if (teamPlayersData.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const playerIds = teamPlayersData.map((tp: any) => tp.player_id)
      const { data: pData, error: pError } = await supabase
        .from('players')
        .select('*')
        .in('id', playerIds)
        
      playersData = pData || []
      console.log("[teamsPage] jogadores encontrados", playersData.length, pError ? `ERRO: ${pError.message}` : '')
    }
  }

  // Enriquecer os times com os vínculos, permitindo que a dupla exista mesmo sem jogadores
  const teams = (teamsData || []).map((team: { id: string, name: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const links = teamPlayersData.filter((tp: any) => tp.team_id === team.id)
    return {
      ...team,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      team_players: links.map((link: any) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        player: playersData.find((p: any) => p.id === link.player_id) || null
      }))
    }
  })
    
  const count = teams.length;
  const isLimitReached = count >= 2;
  const isOverLimit = count > 2;

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      <div className="mb-16">
        <Link
          href={`/championships/${id}`}
          className="inline-flex items-center text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Jornada
        </Link>
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
        <span className="text-sm font-bold tracking-widest text-primary uppercase">
          Participantes
        </span>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          {championship.name}
        </h1>
        <p className="text-lg text-foreground-muted">
          Monte as equipes que disputarão este campeonato.
        </p>
      </div>

      {isOverLimit && (
        <div className="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger-muted text-center">
          Foi detectada uma inconsistência: Existem mais de 2 duplas cadastradas. Nenhuma nova inserção é permitida.
        </div>
      )}

      {/* Progress Indicator (hidden when == 2) */}
      {!isLimitReached && (
        <div className="max-w-xs mx-auto mb-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="h-1 w-full bg-surface-elevated rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${(count / 2) * 100}%` }}
            />
          </div>
          <p className="text-sm font-medium text-foreground-muted tracking-widest uppercase">
            Duplas cadastradas <span className="text-foreground ml-2">{count} / 2</span>
          </p>
        </div>
      )}

      {/* Teams Grid / VS View */}
      <div className="flex-1 flex flex-col items-center">
        {isLimitReached ? (
          /* Cinematic VS View */
          <div className="w-full max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500 ease-out">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              {/* Team A */}
              <div className="w-full md:w-2/5">
                <div className="relative group rounded-3xl border border-border bg-surface-elevated/50 p-8 shadow-2xl overflow-hidden hover:border-primary/50 transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(159,251,0,0.15)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <h3 className="text-3xl font-black text-foreground mb-6 truncate relative z-10">
                    {teams![0].name}
                  </h3>
                  <div className="space-y-4 relative z-10">
                    {teams![0].team_players.map((tp, idx: number) => (
                      <div key={idx} className="flex items-center text-foreground-muted">
                        <User className="h-5 w-5 mr-3 opacity-50" />
                        <span className="font-medium text-lg">{tp.player?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* VS Badge */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-surface-high tracking-tighter italic">VS</span>
              </div>

              {/* Team B */}
              <div className="w-full md:w-2/5">
                <div className="relative group rounded-3xl border border-border bg-surface-elevated/50 p-8 shadow-2xl overflow-hidden hover:border-primary/50 transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(159,251,0,0.15)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <h3 className="text-3xl font-black text-foreground mb-6 truncate relative z-10 text-right">
                    {teams![1].name}
                  </h3>
                  <div className="space-y-4 relative z-10 flex flex-col items-end">
                    {teams![1].team_players.map((tp, idx: number) => (
                      <div key={idx} className="flex items-center text-foreground-muted">
                        <span className="font-medium text-lg mr-3">{tp.player?.name}</span>
                        <User className="h-5 w-5 opacity-50" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-20 flex justify-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              <Link
                href={`/championships/${id}/match`}
                className="inline-flex items-center justify-center rounded-full bg-primary px-12 py-5 text-xl font-bold text-primary-foreground hover:bg-primary-hover transition-all duration-300 hover:scale-105 shadow-[0_0_40px_rgba(159,251,0,0.3)] hover:shadow-[0_0_60px_rgba(159,251,0,0.5)] active:scale-95"
              >
                <Play className="mr-3 h-6 w-6 fill-current" />
                CONTINUAR PARA O CONFRONTO
              </Link>
            </div>
          </div>
        ) : (
          /* Normal Grid View (0 or 1 team) */
          <div className="w-full max-w-4xl mx-auto grid gap-6 sm:grid-cols-2">
            {teams?.map((team) => (
              <div 
                key={team.id} 
                className="group relative rounded-2xl border border-border bg-surface p-8 transition-all duration-300 hover:scale-[1.01] hover:border-primary/30 hover:shadow-[0_0_15px_rgba(159,251,0,0.1)]"
              >
                <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary animate-pulse" />
                <h3 className="text-xl font-bold text-foreground mb-6">{team.name}</h3>
                <div className="space-y-3">
                  {team.team_players.map((tp, idx: number) => (
                    <div key={idx} className="flex items-center text-foreground-muted">
                      <User className="h-4 w-4 mr-3 opacity-50" />
                      <span className="text-sm font-medium">{tp.player?.name}</span>
                      {tp.player?.phone && (
                        <div className="ml-auto flex items-center text-xs opacity-50">
                          <Phone className="h-3 w-3 mr-1" />
                          {tp.player.phone}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {!isLimitReached && (
              <div className="h-full min-h-[200px]">
                <NewTeamButton championshipId={id} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
