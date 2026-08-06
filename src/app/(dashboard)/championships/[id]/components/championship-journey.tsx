"use client"

import { Users, MonitorPlay, Activity, Trophy, Monitor, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface JourneyProps {
  championshipId: string
  teamsCount: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentMatch: any | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: any | null
  hasPlaces?: boolean
  firstResourceNumber?: number
}

export function ChampionshipJourney({
  championshipId,
  teamsCount,
  currentMatch,
  settings,
  hasPlaces = false,
  firstResourceNumber
}: JourneyProps) {
  
  const hasSettings = !!settings;
  const hasTeams = teamsCount >= 2;
  const matchCreated = currentMatch !== null;
  const matchFinished = currentMatch?.status === "finished";

  return (
    <div className="mt-8">
      {!hasSettings && (
        <div className="mb-8 rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center shadow-[0_0_30px_rgba(159,251,0,0.1)]">
          <h2 className="text-xl font-bold text-white mb-2">Evento Recebido</h2>
          <p className="text-zinc-400 mb-6">
            Este evento ainda não possui configuração esportiva.
            É necessário configurá-lo antes de iniciar a operação.
          </p>
          <Link
            href={`/championships/${championshipId}/settings`}
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground hover:bg-primary-hover shadow-[0_0_20px_rgba(159,251,0,0.3)] transition-all"
          >
            INICIAR CONFIGURAÇÃO
          </Link>
        </div>
      )}

      {hasSettings && (
        <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Configuração Esportiva Concluída</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400 mt-1">
                <span>{settings.sport === 'truco' ? 'Truco' : settings.sport}</span>
                <span>•</span>
                <span>{settings.format === 'direct_match' ? 'Confronto Direto' : settings.format}</span>
                <span>•</span>
                <span>Melhor de {settings.best_of}</span>
                <span>•</span>
                <span>Quedas até {settings.target_score}</span>
                <span>•</span>
                <span>Empate: {settings.draw_allowed ? 'Sim' : 'Não'}</span>
                <span>•</span>
                <span>W.O: {settings.wo_timeout_minutes}m</span>
              </div>
            </div>
          </div>
          <Link
            href={`/championships/${championshipId}/settings`}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
          >
            EDITAR CONFIGURAÇÃO
          </Link>
        </div>
      )}

      <h2 className="text-lg font-semibold text-white">Jornada Operacional</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        
        {/* Card 1: Arenas */}
        {/* Card 1: Locais */}
        <div className={`rounded-xl border p-6 transition-all ${
          hasSettings && !hasPlaces ? "border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : "border-zinc-800 bg-zinc-900/50"
        } ${!hasSettings ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
            <MonitorPlay className="h-5 w-5 text-amber-400" />
          </div>
          <h3 className="mt-4 font-semibold text-white">1. Locais de Jogo</h3>
          <p className="mt-2 text-sm text-zinc-400">
            {!hasPlaces ? "Configure os locais onde os confrontos serão realizados." : "Infraestrutura configurada."}
          </p>
          <div className="mt-4">
            <Link 
              href={hasSettings ? `/championships/${championshipId}/arenas` : "#"}
              className="inline-flex w-full items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-400 disabled:opacity-50"
            >
              {!hasPlaces ? "Configurar Locais" : "Gerenciar Locais"}
            </Link>
          </div>
        </div>

        {/* Card 2: Equipes */}
        <div className={`rounded-xl border p-6 transition-all ${
          hasSettings && !hasTeams ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]" : "border-zinc-800 bg-zinc-900/50"
        } ${!hasSettings ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20">
            <Users className="h-5 w-5 text-indigo-400" />
          </div>
          <h3 className="mt-4 font-semibold text-white">2. Participantes ({teamsCount}/2)</h3>
          <p className="mt-1 text-sm text-zinc-400">
            {!hasTeams ? "Cadastre as duas duplas para iniciar." : "Duplas cadastradas."}
          </p>
          <div className="mt-4">
            <Link 
              href={`/championships/${championshipId}/teams`}
              className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              {hasTeams ? "Gerenciar Equipes" : "Cadastrar Duplas"}
            </Link>
          </div>
        </div>

        {/* Card 3: Chaveamento */}
        <div className={`rounded-xl border p-6 transition-all ${
          hasSettings && hasTeams && !matchCreated ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "border-zinc-800 bg-zinc-900/50"
        } ${!hasSettings || !hasTeams ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
            <Activity className="h-5 w-5 text-emerald-400" />
          </div>
          <h3 className="mt-4 font-semibold text-white">3. Chaveamento</h3>
          <p className="mt-1 text-sm text-zinc-400">
            {!matchCreated ? "O Tournament Engine definirá os Encounters." : "Chaveamento gerado."}
          </p>
          <div className="mt-4">
            <Link 
              href={hasSettings && hasTeams ? `/championships/${championshipId}/match` : "#"}
              className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
            >
              {!matchCreated ? "Gerar Chaveamento" : "Ver Chaveamento"}
            </Link>
          </div>
        </div>

        {/* Card 4: Operação */}
        <div className={`rounded-xl border p-6 transition-all ${
          hasSettings && hasTeams && matchCreated && hasPlaces ? "border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]" : "border-zinc-800 bg-zinc-900/50"
        } ${!hasSettings || !hasTeams || !matchCreated || !hasPlaces ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
            <Monitor className="h-5 w-5 text-cyan-400" />
          </div>
          <h3 className="mt-4 font-semibold text-white">4. Central de Operações</h3>
          <p className="mt-1 text-sm text-zinc-400">
            {!hasPlaces ? "Configure os locais para abrir a operação." : "Controle a fila e os locais de jogo."}
          </p>
          <div className="mt-4">
            <Link 
              href={hasSettings && hasTeams && matchCreated && hasPlaces ? `/championships/${championshipId}/operation` : "#"}
              className="inline-flex w-full items-center justify-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-400 disabled:opacity-50"
              aria-disabled={!hasSettings || !hasTeams || !matchCreated || !hasPlaces}
            >
              Abrir Operação
            </Link>
          </div>
        </div>

        {/* Card 4: Tela Pública */}
        {hasSettings && matchCreated && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
              <Monitor className="h-5 w-5 text-cyan-400" />
            </div>
            <h3 className="mt-4 font-semibold text-white">Telão Público</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Acompanhe o placar ao vivo (somente leitura).
            </p>
            <div className="mt-4">
              <a 
                href={firstResourceNumber ? `/public/table/${firstResourceNumber}?championship=${championshipId}` : '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-400 hover:bg-cyan-500/30"
              >
                Abrir Telão
              </a>
            </div>
          </div>
        )}

        {/* Card 5: Resultado */}
        {hasSettings && matchFinished && (
          <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 p-6 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20">
              <Trophy className="h-5 w-5 text-rose-400" />
            </div>
            <h3 className="mt-4 font-semibold text-white">Resultado</h3>
            <p className="mt-1 text-sm text-zinc-400">
              O confronto foi finalizado.
            </p>
            <div className="mt-4">
              <Link 
                href={`/championships/${championshipId}/results`}
                className="inline-flex w-full items-center justify-center rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-400"
              >
                Ver Resultado
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
