"use client"

import { Users, MonitorPlay, Activity, Trophy, Monitor } from "lucide-react"
import Link from "next/link"

interface JourneyProps {
  championshipId: string
  teamsCount: number
  tableStatus: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentMatch: any | null
}

export function ChampionshipJourney({
  championshipId,
  teamsCount,
  tableStatus,
  currentMatch,
}: JourneyProps) {
  
  const hasTeams = teamsCount >= 2;
  const hasTable = tableStatus !== null;
  const matchCreated = currentMatch !== null;
  const matchInProgress = currentMatch?.status === "in_progress";
  const matchFinished = currentMatch?.status === "finished";

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-white">Jornada Operacional</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        
        {/* Card 1: Equipes */}
        <div className={`rounded-xl border p-6 transition-all ${
          !hasTeams ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]" : "border-zinc-800 bg-zinc-900/50"
        }`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20">
            <Users className="h-5 w-5 text-indigo-400" />
          </div>
          <h3 className="mt-4 font-semibold text-white">1. Equipes ({teamsCount}/2)</h3>
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

        {/* Card 2: Mesa 1 */}
        <div className={`rounded-xl border p-6 transition-all ${
          hasTeams && !hasTable ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "border-zinc-800 bg-zinc-900/50"
        } ${!hasTeams ? "opacity-50" : ""}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
            <MonitorPlay className="h-5 w-5 text-emerald-400" />
          </div>
          <h3 className="mt-4 font-semibold text-white">2. Mesa 1</h3>
          <p className="mt-1 text-sm text-zinc-400">
            {!hasTable ? "Prepare a Mesa 1 para o jogo." : `Status: ${tableStatus}`}
          </p>
          <div className="mt-4">
            <Link 
              href={hasTeams ? `/championships/${championshipId}/table/setup` : "#"}
              className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
              aria-disabled={!hasTeams}
            >
              Preparar Mesa 1
            </Link>
          </div>
        </div>

        {/* Card 3: Partida */}
        <div className={`rounded-xl border p-6 transition-all ${
          hasTable && !matchCreated ? "border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : "border-zinc-800 bg-zinc-900/50"
        } ${!hasTable ? "opacity-50" : ""}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
            <Activity className="h-5 w-5 text-amber-400" />
          </div>
          <h3 className="mt-4 font-semibold text-white">3. Confronto</h3>
          <p className="mt-1 text-sm text-zinc-400">
            {!matchCreated ? "Gere o confronto entre as duplas." : (matchInProgress ? "Partida em andamento." : (matchFinished ? "Partida encerrada." : "Confronto gerado."))}
          </p>
          <div className="mt-4">
            <Link 
              href={hasTable ? `/championships/${championshipId}/match` : "#"}
              className="inline-flex w-full items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-400 disabled:opacity-50"
            >
              {!matchCreated ? "Gerar Confronto" : (matchInProgress ? "Abrir Placar (Controle)" : "Ver Partida")}
            </Link>
          </div>
        </div>

        {/* Card 4: Tela Pública */}
        {matchCreated && (
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
                href={`/public/table/1?championship=${championshipId}`}
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
        {matchFinished && (
          <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 p-6 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20">
              <Trophy className="h-5 w-5 text-rose-400" />
            </div>
            <h3 className="mt-4 font-semibold text-white">Resultado</h3>
            <p className="mt-1 text-sm text-zinc-400">
              A Mesa 1 foi finalizada.
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
