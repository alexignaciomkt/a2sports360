"use client"

import { useState, useEffect } from "react"
import { registerPoint, undoLastPoint } from "./actions"
import { createClient } from "@/lib/supabase/client"
import { RotateCcw, Trophy } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

interface ScoreboardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  match: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamA: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamB: any;
  tokenHash: string;
}

export function ScoreboardClient({ match: initialMatch, teamA, teamB, tokenHash }: ScoreboardProps) {
  const [match, setMatch] = useState(initialMatch)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // A device ID for the session to trace events
  const [deviceId] = useState(() => uuidv4())

  const isFinished = match.status === 'finished'

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
    if (loading || isFinished) return
    setLoading(true)
    setError(null)

    const res = await registerPoint(match.id, teamId, points, tokenHash, deviceId)
    if (!res.success) {
      setError(res.error!)
    } else {
      setMatch(res.state)
    }
    setLoading(false)
  }

  async function handleUndo() {
    if (loading) return
    setLoading(true)
    setError(null)

    const res = await undoLastPoint(match.id, tokenHash)
    if (!res.success) {
      setError(res.error!)
    } else {
      setMatch(res.state)
    }
    setLoading(false)
  }

  const pointValues = [1, 3, 6, 9, 12]

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
      {error && (
        <div className="mb-4 w-full rounded-md bg-red-500/10 p-4 text-center text-red-400">
          {error}
        </div>
      )}

      {isFinished && (
        <div className="mb-8 flex w-full flex-col items-center justify-center rounded-xl border border-rose-500/50 bg-rose-500/10 p-8 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
          <Trophy className="h-16 w-16 text-rose-500" />
          <h2 className="mt-4 text-2xl font-bold text-white">Partida Encerrada</h2>
          <p className="mt-2 text-lg text-rose-200">
            Vencedor: <span className="font-bold text-white">{match.winner_team_id === teamA.id ? teamA.name : teamB.name}</span>
          </p>
        </div>
      )}

      <div className="flex w-full flex-col sm:flex-row items-stretch justify-between gap-6">
        {/* TEAM A */}
        <div className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 flex flex-col items-center relative overflow-hidden">
          {match.winner_team_id === teamA.id && <div className="absolute inset-0 bg-emerald-500/10" />}
          <h3 className="text-xl font-semibold text-zinc-300 uppercase tracking-widest">{teamA.name}</h3>
          <div className="my-8 text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-md">
            {match.team_a_score}
          </div>
          
          <div className="w-full space-y-3 z-10">
            {pointValues.map(pts => (
              <button
                key={pts}
                onClick={() => handleScore(teamA.id, pts)}
                disabled={loading || isFinished}
                className="w-full rounded-xl bg-indigo-600 py-4 text-xl font-bold text-white shadow-lg transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
              >
                +{pts}
              </button>
            ))}
          </div>
        </div>

        {/* TEAM B */}
        <div className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 flex flex-col items-center relative overflow-hidden">
          {match.winner_team_id === teamB.id && <div className="absolute inset-0 bg-emerald-500/10" />}
          <h3 className="text-xl font-semibold text-zinc-300 uppercase tracking-widest">{teamB.name}</h3>
          <div className="my-8 text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-md">
            {match.team_b_score}
          </div>
          
          <div className="w-full space-y-3 z-10">
            {pointValues.map(pts => (
              <button
                key={pts}
                onClick={() => handleScore(teamB.id, pts)}
                disabled={loading || isFinished}
                className="w-full rounded-xl bg-rose-600 py-4 text-xl font-bold text-white shadow-lg transition-all hover:bg-rose-500 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
              >
                +{pts}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 w-full">
        <button
          onClick={handleUndo}
          disabled={loading || (match.team_a_score === 0 && match.team_b_score === 0)}
          className="flex w-full items-center justify-center space-x-2 rounded-xl border border-zinc-700 bg-zinc-800 py-4 text-lg font-medium text-zinc-300 transition-colors hover:bg-zinc-700 active:scale-95 disabled:opacity-30"
        >
          <RotateCcw className="h-5 w-5" />
          <span>Desfazer Último Lançamento</span>
        </button>
      </div>
    </div>
  )
}
