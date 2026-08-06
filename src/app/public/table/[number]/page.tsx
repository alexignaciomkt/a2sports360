import { createClient } from "@/lib/supabase/server"
import { PublicScoreboardClient } from "./public-scoreboard-client"
import { ResourceService } from "@/domains/resource/resource.service"
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
  const resourceService = new ResourceService(supabase)
  const table = await resourceService.getResourceByNumber(championship, parseInt(number))

  if (!table) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let match: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let teamA: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let teamB: any = null;

  if (table.activeGameId) {
    const { data: matchData } = await supabase
      .from('matches')
      .select('*')
      .eq('id', table.activeGameId)
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
        tableName={table.displayName}
      />
    </main>
  )
}
