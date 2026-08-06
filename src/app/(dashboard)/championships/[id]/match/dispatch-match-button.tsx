"use client"

import { useState } from "react"
import { dispatchMatch } from "./actions"
import { Play } from "lucide-react"

export function DispatchMatchButton({ 
  championshipId, 
  encounterId, 
  tableId,
  placeName
}: { 
  championshipId: string
  encounterId: string
  tableId: string
  placeName: string
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDispatch = async () => {
    setIsLoading(true)
    const res = await dispatchMatch(championshipId, encounterId, tableId)
    if (!res.success) {
      alert(res.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end">
      <p className="text-sm font-semibold text-emerald-400 mb-2">{placeName} Livre</p>
      <button
        onClick={handleDispatch}
        disabled={isLoading}
        className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Play className="mr-2 h-4 w-4" />
        {isLoading ? "Enviando..." : "Enviar Próximo Confronto"}
      </button>
    </div>
  )
}
