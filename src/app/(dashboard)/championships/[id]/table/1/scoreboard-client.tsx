"use client"

import { useState, useEffect } from "react"
import { registerPoint, undoLastPoint } from "./actions"
import { createClient } from "@/lib/supabase/client"
import { Minus, Plus, Hash } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

interface ScoreboardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  match: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamA: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamB: any;
  controlState: 'active' | 'missing' | 'occupied_by_another_session' | 'expired' | 'error';
  championshipId: string;
  tableId: string;
  targetScore?: number;
  tableName?: string;
}

export function ScoreboardClient({ match: initialMatch, teamA, teamB, controlState: initialControlState, championshipId, tableId, targetScore = 12, tableName = "Quadra Principal" }: ScoreboardProps) {
  const [match, setMatch] = useState(initialMatch)
  const [controlState, setControlState] = useState(initialControlState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // A device ID for the session to trace events
  const [deviceId] = useState(() => uuidv4())

  const isFinished = match.status === 'finished'
  const isFree = !match || match.status === 'scheduled'

  // Supabase Realtime for the table control
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`match_${match.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${match.id}`
      }, (payload) => {
        setMatch(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [match.id])

  async function handleScore(teamId: string, points: number) {
    if (loading || isFinished || points === 0) return
    setLoading(true)
    setError(null)

    const res = await registerPoint(match.id, teamId, points, deviceId)
    if (!res.success) {
      setError(res.error!)
      if (res.expired) setControlState('expired')
    } else {
      setMatch(res.state)
    }
    setLoading(false)
  }

  async function handleUndo() {
    if (loading) return
    setLoading(true)
    setError(null)

    const res = await undoLastPoint(match.id)
    if (!res.success) {
      setError(res.error!)
      if (res.expired) setControlState('expired')
    } else {
      setMatch(res.state)
    }
    setLoading(false)
  }

  let pointValues = [3, 6, 9, targetScore]
  pointValues = Array.from(new Set(pointValues)).sort((a,b) => a-b)

  function renderTeamCard(teamId: string, teamName: string, currentScore: number, isWinner: boolean, colorClass: 'indigo' | 'rose') {
    const fabClass = colorClass === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.25)]' : 'bg-rose-600 hover:bg-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.25)]'
    const textClass = colorClass === 'indigo' ? 'text-indigo-400' : 'text-rose-400'
    const borderClass = colorClass === 'indigo' ? 'border-indigo-500/50' : 'border-rose-500/50'
    const scoreColorClass = colorClass === 'indigo' ? 'text-indigo-50' : 'text-rose-50'

    return (
      <div className={`flex-1 rounded-[2rem] border border-zinc-800/80 bg-[#0a0a0c] p-6 sm:p-8 flex flex-col items-center justify-start relative overflow-hidden shadow-2xl transition-colors duration-500`}>
        {isWinner && <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />}
        
        {loading && (
          <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center backdrop-blur-sm rounded-[2rem]">
            <span className="h-8 w-8 rounded-full border-4 border-zinc-500 border-t-white animate-spin" />
          </div>
        )}

        <h3 className={`text-center text-xl sm:text-2xl font-black uppercase tracking-[0.15em] ${textClass} mb-2 line-clamp-2 w-full max-w-[90%] leading-tight min-h-[3rem] flex items-center justify-center drop-shadow-sm`}>
          {teamName}
        </h3>

        <div className="flex items-center justify-center w-full min-h-[160px] sm:min-h-[240px] my-4">
          <span 
            key={currentScore} 
            className={`text-[9rem] sm:text-[16rem] font-black tabular-nums tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.08)] leading-none animate-[pop_0.15s_ease-out] ${scoreColorClass}`}
          >
            {currentScore}
          </span>
        </div>

        <div className="flex items-center justify-center gap-6 sm:gap-12 mb-auto w-full z-10">
          <button
            onClick={() => handleUndo()}
            disabled={loading || currentScore === 0 || isFinished}
            className="flex-shrink-0 flex items-center justify-center h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-zinc-800 text-white active:scale-90 disabled:opacity-30 disabled:hover:scale-100 transition-transform shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-zinc-700 hover:bg-zinc-700"
            title="Desfazer ponto"
          >
            <Minus className="h-10 w-10 sm:h-12 sm:w-12 stroke-[2.5]" />
          </button>

          <button
            onClick={() => handleScore(teamId, 1)}
            disabled={loading || isFinished}
            className={`flex-shrink-0 flex items-center justify-center h-20 w-20 sm:h-24 sm:w-24 rounded-full ${fabClass} text-white active:scale-90 disabled:opacity-30 disabled:hover:scale-100 transition-transform border border-white/10`}
            title="Adicionar ponto"
          >
            <Plus className="h-10 w-10 sm:h-12 sm:w-12 stroke-[2.5]" />
          </button>
        </div>
        
        {/* Presets Row: Set to Specific Score */}
        <div className="w-full mt-10">
          <div 
            className="grid gap-2 sm:gap-3 w-full"
            style={{ gridTemplateColumns: `repeat(${pointValues.length}, minmax(0, 1fr))` }}
          >
            {pointValues.map(pts => {
              const delta = pts - currentScore;
              const isDisabled = loading || isFinished || delta <= 0;
              const isTarget = pts === targetScore;

              return (
                <button
                  key={pts}
                  onClick={() => handleScore(teamId, delta)}
                  disabled={isDisabled}
                  className={`flex flex-col items-center justify-center py-2 sm:py-3 rounded-[1rem] transition-transform active:scale-95 disabled:opacity-30 disabled:hover:scale-100 shadow-lg border
                    ${isDisabled ? 'bg-zinc-900 border-zinc-800 text-zinc-600' : 
                      isTarget ? `bg-zinc-800/80 ${borderClass} ${textClass} hover:bg-zinc-700` :
                      'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'}
                  `}
                >
                  <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest opacity-60 mb-0.5">IR PARA</span>
                  <span className="font-black text-2xl sm:text-3xl leading-none">{pts}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (controlState === 'missing') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full">
        <h2 className="text-2xl font-bold text-white mb-4">Mesa Livre</h2>
        <p className="text-zinc-400 mb-8 max-w-md">Não há nenhuma sessão de controle ativa para esta mesa. Assuma o controle para iniciar a pontuação.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors"
        >
          Iniciar Controle
        </button>
      </div>
    )
  }

  if (controlState === 'occupied_by_another_session') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full">
        <h2 className="text-2xl font-bold text-rose-500 mb-4">Mesa Ocupada</h2>
        <p className="text-zinc-400 mb-8 max-w-md">Outro dispositivo já está controlando esta mesa. Você pode forçar a tomada de controle se necessário.</p>
        <button
          onClick={async () => {
            setLoading(true)
            const { takeOverControlSession } = await import('./actions')
            const res = await takeOverControlSession(championshipId, match.id, tableId)
            if (res.success) setControlState('active')
            setLoading(false)
          }}
          disabled={loading}
          className="px-6 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
        >
          {loading ? 'Processando...' : 'Assumir Controle (Takeover)'}
        </button>
      </div>
    )
  }

  if (controlState === 'expired') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full">
        <h2 className="text-2xl font-bold text-amber-500 mb-4">Sessão Expirada</h2>
        <p className="text-zinc-400 mb-8 max-w-md">Sua sessão de controle expirou ou foi tomada por outro dispositivo.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors"
        >
          Renovar Sessão
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-[1200px] mx-auto px-2 h-full pb-4">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}} />
      
      {/* Broadcast Style Header */}
      <div className="w-full flex items-center justify-between mb-4 bg-[#0a0a0c]/80 px-4 py-3 rounded-2xl border border-zinc-800/60 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="text-sm sm:text-base font-black text-white tracking-[0.2em] uppercase truncate max-w-[150px] sm:max-w-none">
            {tableName}
          </div>
          <div className="h-4 w-px bg-zinc-700 hidden sm:block" />
          <div className="text-xs sm:text-sm font-semibold text-zinc-400 hidden sm:flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {match.id.substring(0, 6).toUpperCase()}
          </div>
        </div>

        <div className="flex items-center">
          {isFinished ? (
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-zinc-400 bg-zinc-800 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-inner">
              <span className="h-2 w-2 rounded-full bg-zinc-500" />
              Finalizado
            </div>
          ) : isFree ? (
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-emerald-400 bg-emerald-900/20 border border-emerald-500/20 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-inner">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Livre
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-blue-400 bg-blue-900/20 border border-blue-500/20 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-inner">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              Em Andamento
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 w-full rounded-xl bg-red-500/10 p-4 text-center text-red-400 border border-red-500/20 shadow-lg font-medium">
          {error}
        </div>
      )}

      {/* Main Scoreboard Area */}
      <div className="flex w-full flex-col md:flex-row items-stretch justify-between gap-4 sm:gap-6 flex-1 min-h-[500px]">
        {renderTeamCard(teamA.id, teamA.name, match.team_a_score, match.winner_team_id === teamA.id, 'indigo')}
        {renderTeamCard(teamB.id, teamB.name, match.team_b_score, match.winner_team_id === teamB.id, 'rose')}
      </div>

      {/* Future Broadcast/Operational Dock */}
      <div className="w-full mt-4 bg-[#0a0a0c]/60 p-2 sm:p-3 rounded-2xl border border-zinc-800/60 flex items-center justify-center gap-2 sm:gap-4 overflow-hidden shadow-inner backdrop-blur-sm">
        {['Cronômetro', 'Árbitro', 'Pausa Técnica', 'Substituição', 'Encerrar'].map((label, idx) => (
          <button key={idx} disabled className="flex-1 min-w-[60px] h-10 sm:h-12 rounded-xl bg-zinc-800/40 border border-zinc-700/30 text-[9px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-widest opacity-60 flex items-center justify-center transition-colors hover:bg-zinc-800/60">
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
