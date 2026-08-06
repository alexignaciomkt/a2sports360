"use client"

import { useState } from "react"
import { resolveMatch } from "./actions"
import { CheckCircle2 } from "lucide-react"

interface ResolveMatchButtonProps {
  championshipId: string
  encounterId: string
  matchId: string
}

export function ResolveMatchButton({ championshipId, encounterId, matchId }: ResolveMatchButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleResolve = async () => {
    setLoading(true)
    setError(null)
    const result = await resolveMatch(championshipId, encounterId, matchId)
    
    if (!result.success) {
      setError(result.error || "Ocorreu um erro ao homologar.")
      setLoading(false)
    }
    // se sucesso, a revalidação já atualizará a UI
  }

  return (
    <div className="flex flex-col items-center space-y-2 mt-4">
      <button
        onClick={handleResolve}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        {loading ? "Homologando..." : "HOMOLOGAR QUEDA"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
