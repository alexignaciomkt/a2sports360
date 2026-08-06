'use client'

import { useEffect, useState, useCallback } from "react"
import { OperationalDashboardSnapshot } from "@/domains/operation/operation.types"
import { fetchDashboardSnapshot, autoDispatch, manualDispatch } from "./actions"
import { AppButton } from "@/components/ui/app-button"
import { AppCard } from "@/components/ui/app-card"
import { AppBadge } from "@/components/ui/app-badge"
import { RefreshCcw, Play, Zap } from "lucide-react"
import Link from "next/link"

export function DashboardClient({
  championshipId,
  initialSnapshot,
}: {
  championshipId: string
  initialSnapshot: OperationalDashboardSnapshot
}) {
  const [snapshot, setSnapshot] = useState<OperationalDashboardSnapshot>(initialSnapshot)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isAutoDispatching, setIsAutoDispatching] = useState(false)
  
  // Polling logic
  const fetchSnapshot = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    
    try {
      setIsRefreshing(true)
      const data = await fetchDashboardSnapshot(championshipId)
      setSnapshot(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to fetch snapshot:", error)
      // Keeps old snapshot on failure as requested
    } finally {
      setIsRefreshing(false)
    }
  }, [championshipId])

  useEffect(() => {
    const interval = setInterval(fetchSnapshot, 5000)
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchSnapshot()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [fetchSnapshot])

  const handleAutoDispatch = async () => {
    try {
      setIsAutoDispatching(true)
      const result = await autoDispatch(championshipId)
      alert(`Despachados: ${result.dispatched_count}\nAguardando: ${result.waiting_count}\nRecursos Livres Restantes: ${result.available_resources_remaining}\nIgnorados: ${result.skipped_count}`)
      await fetchSnapshot()
    } catch (error) {
      alert(`Erro no despacho automático: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsAutoDispatching(false)
    }
  }

  const handleManualDispatch = async (encounterId: string) => {
    // Basic manual dispatch (prompt/modal simplification for now)
    const availableResources = snapshot.resources.filter(r => r.status === 'available')
    if (availableResources.length === 0) {
      alert("Nenhum Local livre disponível.")
      return
    }
    
    const resourceNames = availableResources.map(r => `${r.displayName} (ID: ${r.id})`).join('\n')
    const selectedId = prompt(`Digite o ID do Local desejado:\n\n${resourceNames}`)
    
    if (!selectedId) return;

    if (!availableResources.some(r => r.id === selectedId)) {
      alert("ID inválido.")
      return;
    }

    try {
      const res = await manualDispatch(championshipId, encounterId, selectedId)
      if (res.success) {
        await fetchSnapshot()
      } else {
        alert(res.message)
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro desconhecido')
    }
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER CONTROLS */}
      <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
        <div className="text-sm text-zinc-400 flex items-center">
          Atualizado em: <strong className="text-white ml-2">{lastUpdated.toLocaleTimeString('pt-BR')}</strong>
        </div>
        <div className="flex items-center gap-3">
          <AppButton 
            variant="outline" 
            size="sm" 
            onClick={fetchSnapshot}
            disabled={isRefreshing}
            className="border-zinc-700 hover:bg-zinc-800"
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin text-zinc-500' : 'text-zinc-400'}`} />
            Atualizar
          </AppButton>
          <AppButton 
            onClick={handleAutoDispatch}
            disabled={isAutoDispatching || snapshot.waitingCount === 0 || snapshot.availableResources === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Zap className="w-4 h-4 mr-2" />
            Processar Fila
          </AppButton>
        </div>
      </div>

      {/* OVERVIEW STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AppCard className="bg-zinc-900 border-zinc-800 p-4">
          <p className="text-sm font-medium text-zinc-400">Locais Totais</p>
          <p className="mt-1 text-3xl font-bold text-white">{snapshot.totalResources}</p>
        </AppCard>
        <AppCard className="bg-zinc-900 border-emerald-900/50 relative overflow-hidden p-4">
          <div className="absolute top-0 right-0 p-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-zinc-400">Locais Livres</p>
          <p className="mt-1 text-3xl font-bold text-emerald-400">{snapshot.availableResources}</p>
        </AppCard>
        <AppCard className="bg-zinc-900 border-amber-900/50 p-4">
          <p className="text-sm font-medium text-zinc-400">Aguardando (Fila)</p>
          <p className="mt-1 text-3xl font-bold text-amber-400">{snapshot.waitingCount}</p>
        </AppCard>
        <AppCard className="bg-zinc-900 border-blue-900/50 p-4">
          <p className="text-sm font-medium text-zinc-400">Em Andamento</p>
          <p className="mt-1 text-3xl font-bold text-blue-400">{snapshot.inProgressEncounters}</p>
        </AppCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* RESOURCES GRID */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white">Locais de Jogo</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {snapshot.resources.map(resource => (
              <AppCard key={resource.id} className={`border ${resource.status === 'available' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900'} transition-colors p-4`}>
                <div className="pb-2 flex flex-row items-center justify-between">
                  <h3 className="text-base font-semibold text-white">{resource.displayName}</h3>
                  <AppBadge variant={resource.status === 'available' ? 'success' : 'default'}>
                    {resource.status === 'available' ? 'Livre' : 'Ocupado'}
                  </AppBadge>
                </div>
                <div>
                  {resource.status === 'occupied' ? (
                    <div className="text-sm mt-2">
                      <p className="text-zinc-400 mb-3">Confronto em andamento</p>
                      <Link href={`/championships/${championshipId}/resources/${resource.id}/control`}>
                        <AppButton variant="secondary" className="w-full text-xs" size="sm">
                          Acesso ao Controle
                        </AppButton>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-500 py-4 text-center mt-2">
                      Aguardando despacho...
                    </div>
                  )}
                </div>
              </AppCard>
            ))}
          </div>
        </div>

        {/* QUEUE */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Fila de Confrontos</h2>
          <AppCard className="bg-zinc-900 border-zinc-800 p-0 overflow-hidden">
            <div className="divide-y divide-zinc-800">
              {snapshot.waitingEncounters.length === 0 ? (
                <div className="p-6 text-center text-sm text-zinc-500">
                  Nenhum confronto na fila.
                </div>
              ) : (
                snapshot.waitingEncounters.map(encounter => (
                  <div key={encounter.id} className="p-4 flex flex-col gap-3 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex justify-between items-center text-sm font-medium text-white">
                      <span className="truncate">{encounter.teamAName}</span>
                      <span className="mx-2 text-zinc-500">vs</span>
                      <span className="truncate">{encounter.teamBName}</span>
                    </div>
                    <AppButton 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-zinc-700 text-zinc-300 hover:text-white"
                      onClick={() => handleManualDispatch(encounter.id)}
                    >
                      <Play className="w-3 h-3 mr-2" />
                      Enviar para Local
                    </AppButton>
                  </div>
                ))
              )}
            </div>
          </AppCard>
        </div>

      </div>
    </div>
  )
}
