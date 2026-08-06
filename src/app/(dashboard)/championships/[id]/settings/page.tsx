import { requireTenant } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { SportsConfigForm } from "./sports-config-form"

export default async function ChampionshipSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { tenantId } = await requireTenant()
  const supabase = await createClient()

  // 1. Verificar se o campeonato existe
  const { data: championship } = await supabase
    .from("championships")
    .select("id, name, status")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single()

  if (!championship) {
    notFound()
  }

  // 2. Buscar configurações atuais (se houver)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: settings } = await (supabase.from as any)("championship_settings")
    .select("*")
    .eq("championship_id", id)
    .single()

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      <div className="mb-12">
        <Link
          href={`/championships/${id}`}
          className="inline-flex items-center text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Jornada
        </Link>
      </div>

      <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
        <span className="text-sm font-bold tracking-widest text-primary uppercase">
          Configuração Esportiva
        </span>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          {championship.name}
        </h1>
        <p className="text-lg text-foreground-muted">
          Defina as regras e o formato de disputa que guiarão toda a operação do torneio.
        </p>
      </div>

      <div className="w-full max-w-3xl mx-auto">
        <SportsConfigForm 
          championshipId={championship.id}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialData={settings as any}
        />
      </div>
    </div>
  )
}
