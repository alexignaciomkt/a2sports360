import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, User } from "lucide-react"
import { TeamForm } from "./team-form"

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

  // Get current teams
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      team_players (
        player:players(id, name)
      )
    `)
    .eq('championship_id', id)
    .order('created_at', { ascending: true })
    
  const isLimitReached = (teams?.length || 0) >= 2;

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
          Equipes: {championship.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Cadastre as duas duplas participantes desta mesa. ({teams?.length || 0}/2)
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Formulário (bloqueado se já tem 2) */}
        <div>
          <TeamForm championshipId={id} disabled={isLimitReached} />
          {isLimitReached && (
            <p className="mt-4 text-sm text-emerald-400">
              Limite de 2 duplas atingido. Volte para preparar a Mesa 1.
            </p>
          )}
        </div>

        {/* Lista de equipes criadas */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white">Duplas Cadastradas</h2>
          {teams?.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
              <p className="text-zinc-500">Nenhuma dupla cadastrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teams?.map((team) => (
                <div key={team.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <h4 className="font-semibold text-white">{team.name}</h4>
                  <ul className="mt-2 space-y-1">
                    {team.team_players.map((tp: Record<string, unknown> & { player?: { name: string } }, index: number) => (
                      <li key={index} className="flex items-center text-sm text-zinc-400">
                        <User className="mr-2 h-4 w-4" />
                        {tp.player?.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
