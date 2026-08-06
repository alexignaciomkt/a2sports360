import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ChampionshipService } from "@/domains/championship/championship.service"
import Link from "next/link"
import { 
  Trophy, 
  PlayCircle, 
  Settings2, 
  Activity, 
  Plus, 
  List
} from "lucide-react"
import { AppStat } from "@/components/ui/app-stat"
import { AppBadge } from "@/components/ui/app-badge"

export default async function DashboardPage() {
  const { tenantId, tenantName } = await requireTenant()
  const supabase = await createClient()
  const service = new ChampionshipService(supabase)
  
  const summary = await service.getDashboardSummary(tenantId)
  const recentChampionships = summary.recent

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      
      {/* Header Compacto */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface border border-border/10 rounded-2xl p-6 md:px-8">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-1">Centro de Operações</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            {tenantName}
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 bg-surface-high px-5 py-2.5 rounded-xl border border-border/10">
            <Trophy className="w-5 h-5 text-primary opacity-80" />
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-none text-foreground">{summary.total}</span>
              <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mt-0.5">Total</span>
            </div>
          </div>
          
          <Link 
            href="/championships/new" 
            className="h-11 px-6 flex items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-[0_0_15px_rgba(159,251,0,0.15)] hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(159,251,0,0.25)] transition-all duration-300 hover:-translate-y-0.5"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Campeonato
          </Link>
        </div>
      </div>

      {/* Bento Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AppStat 
          title="Campeonatos"
          value={summary.total}
          icon={<Trophy />}
        />
        <AppStat 
          title="Torneios Ativos"
          value={summary.active}
          icon={<PlayCircle />}
          trend={summary.active > 0 ? { value: "Em Disputa", positive: true } : undefined}
          className={summary.active > 0 ? "border-primary/30" : ""}
        />
        <AppStat 
          title="Rascunhos"
          value={summary.draft}
          icon={<Settings2 />}
        />
        <AppStat 
          title="Últimos Torneios"
          value={summary.recent.length}
          icon={<Activity />}
        />
      </section>

      {/* Main Grid: Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Campeonatos Recentes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-3">
              <Activity className="text-primary h-5 w-5" />
              Campeonatos Recentes
            </h2>
          </div>
          
          {recentChampionships.length > 0 ? (
            <div className="grid gap-4">
              {recentChampionships.map((champ) => (
                <div key={champ.id} className="bg-surface border border-border/10 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-primary/30 transition-colors duration-300">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-foreground truncate max-w-[300px] sm:max-w-[400px]">
                        {champ.name}
                      </h3>
                      {champ.status === 'in_progress' && (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-foreground-muted font-medium">
                      <span className="uppercase tracking-wider text-xs">
                        {champ.format === 'one_table_demo' ? 'Local Único' : 'Eliminatório'}
                      </span>
                      {champ.created_at && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-border/50"></span>
                          <span>
                            {new Intl.DateTimeFormat('pt-BR', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric' 
                            }).format(new Date(champ.created_at)).replace(' de ', ' ')}
                          </span>
                        </>
                      )}
                      <span className="w-1 h-1 rounded-full bg-border/50"></span>
                      <AppBadge variant={champ.status === 'draft' ? 'outline' : champ.status === 'in_progress' ? 'primary' : 'default'}>
                        {champ.status === 'draft' ? 'Rascunho' : champ.status === 'in_progress' ? 'Ativo' : 'Finalizado'}
                      </AppBadge>
                    </div>
                  </div>
                  
                  <Link 
                    href={`/championships/${champ.id}`}
                    className="shrink-0 h-10 px-5 flex items-center justify-center rounded-lg bg-surface-high border border-border/10 text-foreground text-sm font-bold hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all duration-300"
                  >
                    Abrir Campeonato
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-border/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center shadow-inner relative overflow-hidden group">
              <Trophy className="h-16 w-16 text-primary/20 mb-6 group-hover:scale-110 group-hover:text-primary/40 transition-all duration-500" />
              <h3 className="text-xl font-bold text-foreground mb-3">Nenhum campeonato criado</h3>
              <p className="text-foreground-muted font-medium max-w-sm mx-auto leading-relaxed mb-8">
                Crie o primeiro campeonato para começar a organizar equipes, locais e partidas.
              </p>
              <Link 
                href="/championships/new" 
                className="h-12 px-8 flex items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/10"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Campeonato
              </Link>
            </div>
          )}
        </div>

        {/* Ações Rápidas */}
        <div className="space-y-6">
          <section className="bg-surface border border-border/10 rounded-3xl p-8 relative overflow-hidden group hover:border-primary/20 transition-colors duration-500">
            <h2 className="text-lg font-display font-bold text-foreground mb-6 relative z-10 flex items-center gap-3">
               Ações Rápidas
            </h2>
            
            <div className="flex flex-col gap-3 relative z-10">
              <Link 
                href="/championships/new" 
                className="w-full h-12 flex items-center px-5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold hover:bg-primary hover:text-primary-foreground transition-all duration-300 group/btn"
              >
                <Plus className="mr-3 h-4 w-4 opacity-70 group-hover/btn:opacity-100" />
                Novo Campeonato
              </Link>
              
              <Link
                href="/championships" 
                className="w-full h-12 flex items-center px-5 rounded-xl bg-surface-high border border-border/10 text-foreground text-sm font-bold hover:bg-surface-elevated transition-all duration-300 group/btn"
              >
                <List className="mr-3 h-4 w-4 opacity-70 text-foreground-muted group-hover/btn:text-foreground" />
                Ver Campeonatos
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

