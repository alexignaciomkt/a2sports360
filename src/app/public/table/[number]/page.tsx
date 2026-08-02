import { createClient } from "@/lib/supabase/server"
import { PublicScoreboardClient } from "./public-scoreboard-client"
import { notFound } from "next/navigation"

export default async function PublicTablePage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>
  searchParams: Promise<{ championship: string }>
}) {
  const { number } = await params
  const { championship } = await searchParams
  
  if (!championship) notFound()

  const supabase = await createClient()

  // Find table
  const { data: table } = await supabase
    .from('game_tables')
    .select('*')
    .eq('championship_id', championship)
    .eq('number', parseInt(number))
    .single()

  if (!table) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let match: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let teamA: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let teamB: any = null;

  if (table.current_match_id) {
    const { data: matchData } = await supabase
      .from('matches')
      .select('*')
      .eq('id', table.current_match_id)
      .single()
      
    match = matchData

    if (match) {
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name')
        .in('id', [match.team_a_id, match.team_b_id])
        
      teamA = teams?.find(t => t.id === match.team_a_id)
      teamB = teams?.find(t => t.id === match.team_b_id)
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <PublicScoreboardClient 
        match={match} 
        teamA={teamA} 
        teamB={teamB} 
      />
    </main>
  )
}
