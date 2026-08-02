import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { randomBytes } from "crypto"

export default async function TableSetupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const { tenantId } = await requireTenant()
  const supabase = await createClient()
  
  // Verify access
  const { data: championship } = await supabase
    .from('championships')
    .select('id, name')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()
    
  if (!championship) notFound()

  // Check if Table 1 exists
  const { data: existingTable } = await supabase
    .from('game_tables')
    .select('*')
    .eq('championship_id', id)
    .eq('number', 1)
    .single()

  // If it doesn't exist, create it on load (idempotent setup)
  if (!existingTable) {
    const qrToken = randomBytes(16).toString("hex");
    
    await supabase.from('game_tables').insert({
      championship_id: id,
      number: 1,
      qr_token: qrToken,
      status: 'available'
    })
    
    // Redirect to refresh and avoid resubmission on reload
    redirect(`/championships/${id}/table/setup`)
  }

  // Get linked teams
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .eq('championship_id', id)
    .order('created_at', { ascending: true })

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
          Mesa 1: {championship.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          A mesa foi preparada e está pronta para uso.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-white">Mesa Disponível</h2>
          <p className="mt-2 text-zinc-400 max-w-md">
            As duas duplas inscritas já podem ser vinculadas a esta mesa para a partida.
          </p>
          
          <div className="mt-6 flex w-full max-w-md flex-col space-y-2 text-left">
            {teams?.map((t, idx) => (
              <div key={t.id} className="rounded-md bg-zinc-950 px-4 py-3 text-sm text-zinc-300 border border-zinc-800 flex justify-between">
                <span>Dupla {idx + 1}</span>
                <span className="font-semibold text-white">{t.name}</span>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href={`/championships/${id}`}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-6 py-3 font-semibold text-white hover:bg-indigo-400"
            >
              Voltar e Gerar Confronto
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
