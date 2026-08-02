"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Trophy } from "lucide-react"

interface MatchProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  match: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamA: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamB: any;
}

export function PublicScoreboardClient({ match: initialMatch, teamA, teamB }: MatchProps) {
  const [match, setMatch] = useState(initialMatch)
  
  const isFinished = match?.status === 'finished'

  useEffect(() => {
    if (!match) return;
    
    const supabase = createClient()
    const channel = supabase
      .channel(`public_match_${match.id}`)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.id])

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-12 bg-black">
        <h1 className="text-3xl font-bold text-white">Aguardando Início da Partida</h1>
        <p className="mt-4 text-xl text-zinc-400">O organizador ainda não iniciou o confronto nesta mesa.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-8 bg-black">
      {isFinished && (
        <div className="mb-12 flex w-full max-w-5xl flex-col items-center justify-center rounded-2xl border border-rose-500/50 bg-rose-500/10 p-12 shadow-[0_0_30px_rgba(244,63,94,0.15)] animate-in fade-in zoom-in duration-500">
          <Trophy className="h-24 w-24 text-rose-500 mb-6" />
          <h2 className="text-4xl font-bold text-white">VITÓRIA!</h2>
          <p className="mt-4 text-5xl font-black text-rose-400 uppercase tracking-widest">
            {match.winner_team_id === teamA.id ? teamA.name : teamB.name}
          </p>
        </div>
      )}

      <div className="flex w-full max-w-6xl flex-col md:flex-row items-stretch justify-between gap-12">
        {/* TEAM A */}
        <div className="flex-1 rounded-[2rem] border border-zinc-800 bg-zinc-900/50 p-12 flex flex-col items-center relative overflow-hidden">
          {match.winner_team_id === teamA.id && <div className="absolute inset-0 bg-emerald-500/10" />}
          <h3 className="text-4xl font-bold text-zinc-300 uppercase tracking-widest text-center truncate w-full">{teamA.name}</h3>
          <div className="mt-12 text-[12rem] leading-none font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">
            {match.team_a_score}
          </div>
        </div>

        <div className="hidden md:flex flex-col items-center justify-center px-4">
          <span className="text-4xl font-bold text-zinc-700">VS</span>
        </div>

        {/* TEAM B */}
        <div className="flex-1 rounded-[2rem] border border-zinc-800 bg-zinc-900/50 p-12 flex flex-col items-center relative overflow-hidden">
          {match.winner_team_id === teamB.id && <div className="absolute inset-0 bg-emerald-500/10" />}
          <h3 className="text-4xl font-bold text-zinc-300 uppercase tracking-widest text-center truncate w-full">{teamB.name}</h3>
          <div className="mt-12 text-[12rem] leading-none font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">
            {match.team_b_score}
          </div>
        </div>
      </div>
    </div>
  )
}
