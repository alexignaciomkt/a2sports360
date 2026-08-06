"use client"

import { useState } from "react"
import { Save, QrCode, Edit2, PlayCircle } from "lucide-react"
import { AppCard } from "@/components/ui/app-card"
import { AppButton } from "@/components/ui/app-button"
import { ResourceType, GameResource } from "@/domains/resource/resource.types"
import { configureArenas, createSingleResource } from "./actions"
import { getResourceCatalogOptions } from "@/domains/resource/resource-catalog"

export function ArenasClient({
  championshipId,
  initialResources,
}: {
  championshipId: string
  initialResources: GameResource[]
}) {
  // Lote State
  const [isSubmittingLote, setIsSubmittingLote] = useState(false)
  const [errorLote, setErrorLote] = useState<string | null>(null)
  const [typeLote, setTypeLote] = useState<ResourceType>("COURT")
  const [prefixLote, setPrefixLote] = useState("Quadra")
  const [quantityLote, setQuantityLote] = useState<number>(4)

  // Manual State
  const [isSubmittingManual, setIsSubmittingManual] = useState(false)
  const [errorManual, setErrorManual] = useState<string | null>(null)
  const [typeManual, setTypeManual] = useState<ResourceType>("COURT")
  const [nameManual, setNameManual] = useState("")
  const [orderManual, setOrderManual] = useState<number>(
    initialResources.length > 0 ? Math.max(...initialResources.map(r => r.displayOrder)) + 1 : 1
  )

  const [localResources, setLocalResources] = useState<GameResource[]>(initialResources)
  
  const catalogOptions = getResourceCatalogOptions()

  const handleLoteSubmit = async () => {
    setIsSubmittingLote(true)
    setErrorLote(null)

    const res = await configureArenas(championshipId, typeLote, prefixLote, quantityLote)
    
    if (res.success && res.data) {
      if (res.data.reduction_requested) {
        setErrorLote(res.data.message || "A redução exige ação administrativa segura.")
      } else if (res.data.resources) {
        setLocalResources(res.data.resources)
      }
    } else {
      setErrorLote(res.error || "Ocorreu um erro ao gerar locais em lote.")
    }
    
    setIsSubmittingLote(false)
  }

  const handleManualSubmit = async () => {
    if (!nameManual.trim()) return

    setIsSubmittingManual(true)
    setErrorManual(null)

    const res = await createSingleResource(championshipId, nameManual.trim(), typeManual, orderManual)
    
    if (res.success && res.data) {
      setLocalResources(prev => [...prev, res.data].sort((a, b) => a.displayOrder - b.displayOrder))
      setNameManual("")
      setOrderManual(prev => prev + 1)
    } else {
      setErrorManual(res.error || "Ocorreu um erro ao adicionar o local.")
    }

    setIsSubmittingManual(false)
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card 1: Adicionar Local (Manual) */}
        <AppCard title="Adicionar Local">
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-zinc-400">Nome do Local</label>
              <input
                type="text"
                value={nameManual}
                onChange={(e) => setNameManual(e.target.value)}
                className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Ex: Quadra Principal, Mesa TV"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-400">Tipo</label>
                <select
                  value={typeManual}
                  onChange={(e) => setTypeManual(e.target.value as ResourceType)}
                  className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {catalogOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.singular}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-zinc-400">Ordem</label>
                <input
                  type="number"
                  min={1}
                  value={orderManual}
                  onChange={(e) => setOrderManual(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {errorManual && (
              <div className="rounded-md bg-rose-500/10 p-3 text-sm text-rose-400 border border-rose-500/20">
                {errorManual}
              </div>
            )}

            <AppButton 
              className="w-full mt-4" 
              onClick={handleManualSubmit}
              disabled={isSubmittingManual || !nameManual.trim()}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmittingManual ? "ADICIONANDO..." : "ADICIONAR LOCAL"}
            </AppButton>
          </div>
        </AppCard>

        {/* Card 2: Gerar em Lote */}
        <AppCard title="Gerar em Lote">
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-400">Tipo</label>
                <select
                  value={typeLote}
                  onChange={(e) => setTypeLote(e.target.value as ResourceType)}
                  className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {catalogOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.singular}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-400">Quantidade</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={quantityLote}
                  onChange={(e) => setQuantityLote(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-400">Nome Base</label>
              <input
                type="text"
                value={prefixLote}
                onChange={(e) => setPrefixLote(e.target.value)}
                className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Ex: Quadra, Arena Norte"
              />
            </div>

            {errorLote && (
              <div className="rounded-md bg-rose-500/10 p-3 text-sm text-rose-400 border border-rose-500/20">
                {errorLote}
              </div>
            )}

            <AppButton 
              className="w-full mt-4" 
              onClick={handleLoteSubmit}
              disabled={isSubmittingLote || !prefixLote.trim()}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmittingLote ? "GERANDO..." : "GERAR EM LOTE"}
            </AppButton>
          </div>
        </AppCard>
      </div>

      {/* Card 3: Locais Operacionais */}
      <AppCard title="Locais Operacionais" className="border-t-4 border-t-emerald-500">
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {localResources.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500">
              Nenhum local cadastrado. Adicione manualmente ou gere em lote.
            </div>
          )}
          {localResources.map((res) => {
            const isOccupied = res.status === 'occupied'
            return (
              <div key={res.id} className="flex flex-col rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700/80">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-white truncate">{res.displayName}</h3>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${
                    isOccupied ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  }`}>
                    {isOccupied ? 'Ocupado' : 'Livre'}
                  </span>
                </div>
                
                <div className="mt-4 flex-1">
                  {isOccupied ? (
                    <div className="rounded-lg bg-zinc-950/50 p-3 border border-zinc-800/50">
                      <p className="text-xs text-zinc-500 font-medium mb-1">Confronto Atual</p>
                      <p className="text-sm font-semibold text-zinc-300">Confronto em Andamento</p>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-950/30 p-4 text-center">
                      <p className="text-xs text-zinc-500">Aguardando Próximo Confronto</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2 pt-4 border-t border-zinc-800/60">
                  <button className="flex-1 flex items-center justify-center gap-2 rounded-md bg-zinc-800/50 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700/50 transition-colors">
                    <QrCode className="h-3 w-3" />
                    QR Code
                  </button>
                  <button className="flex items-center justify-center rounded-md bg-zinc-800/50 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors">
                    <Edit2 className="h-3 w-3" />
                  </button>
                  {isOccupied && (
                    <button className="flex items-center justify-center rounded-md bg-emerald-500/10 px-3 py-2 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                      <PlayCircle className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </AppCard>
    </div>
  )
}
