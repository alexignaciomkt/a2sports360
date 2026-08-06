"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveChampionshipSettings } from "./actions"

interface SportsConfigFormProps {
  championshipId: string
  initialData?: {
    sport: string
    format: string
    best_of: number
    target_score: number
    draw_allowed: boolean
    tie_break_rule: string | null
    wo_timeout_minutes: number
  } | null
}

export function SportsConfigForm({ championshipId, initialData }: SportsConfigFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bestOf, setBestOf] = useState(initialData?.best_of?.toString() || "3")

  const parsedBestOf = parseInt(bestOf) || 3
  const winsNeeded = Math.floor(parsedBestOf / 2) + 1

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set("championshipId", championshipId)

    const res = await saveChampionshipSettings(formData)

    if (res.success) {
      router.push(`/championships/${championshipId}`)
      router.refresh()
    } else {
      setError(res.error!)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl mx-auto space-y-8">
      {error && (
        <div className="rounded-xl bg-danger/10 border border-danger/20 p-4 text-sm text-danger-muted">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground-muted">Modalidade</label>
          <select 
            name="sport" 
            defaultValue={initialData?.sport || "truco"}
            disabled={loading}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          >
            <option value="truco">Truco</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground-muted">Formato</label>
          <select 
            name="format" 
            defaultValue={initialData?.format || "direct_match"}
            disabled={loading}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          >
            <option value="direct_match">Confronto Direto</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground-muted">Melhor de (Quedas)</label>
          <input 
            type="number"
            name="best_of"
            min="1"
            required
            value={bestOf}
            onChange={(e) => setBestOf(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            placeholder="Ex: 3"
          />
          <div className="flex gap-2 mt-2">
            {[1, 3, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setBestOf(val.toString())}
                className="px-3 py-1 text-xs rounded-full border border-border bg-surface-elevated hover:bg-border transition-colors text-foreground-muted"
              >
                {val}
              </button>
            ))}
          </div>
          <p className="text-xs text-primary/80 pt-1">
            Vence quem ganhar {winsNeeded} queda(s).
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground-muted">Pontuação-limite por queda</label>
          <input 
            type="number"
            name="target_score"
            min="1"
            required
            defaultValue={initialData?.target_score || "12"}
            disabled={loading}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <p className="text-xs text-foreground-muted/50 pt-1">Geralmente 12 ou 15 para Truco.</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground-muted">Permitir Empate (na queda)?</label>
          <select 
            name="draw_allowed" 
            defaultValue={initialData ? (initialData.draw_allowed ? "true" : "false") : "false"}
            disabled={loading}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          >
            <option value="false">Não</option>
            <option value="true">Sim</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground-muted">Tempo para W.O. (Minutos)</label>
          <input 
            type="number"
            name="wo_timeout_minutes"
            min="0"
            required
            defaultValue={initialData?.wo_timeout_minutes || "10"}
            disabled={loading}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
        </div>
      </div>

      <div className="pt-6 border-t border-border flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-all active:scale-95 shadow-[0_0_20px_rgba(159,251,0,0.2)]"
        >
          {loading ? "Salvando..." : "SALVAR CONFIGURAÇÃO"}
        </button>
      </div>
    </form>
  )
}
