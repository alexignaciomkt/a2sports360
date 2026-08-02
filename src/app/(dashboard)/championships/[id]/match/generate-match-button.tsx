"use client"

import { useState } from "react"
import { generateMatch } from "./actions"

export function GenerateMatchButton({ championshipId }: { championshipId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    const res = await generateMatch(championshipId)
    if (!res.success) {
      setError(res.error!)
      setLoading(false)
    }
    // if success, the server action revalidates the path and the page updates.
  }

  return (
    <div className="flex flex-col items-center">
      {error && (
        <div className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-8 py-4 text-lg font-semibold text-white hover:bg-amber-400 disabled:opacity-50"
      >
        {loading ? "Gerando..." : "Gerar Confronto Oficial"}
      </button>
    </div>
  )
}
