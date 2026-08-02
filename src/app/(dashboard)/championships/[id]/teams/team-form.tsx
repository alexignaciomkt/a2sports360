"use client"

import { useState } from "react"
import { createTeam } from "./actions"

export function TeamForm({ championshipId, disabled }: { championshipId: string, disabled: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (disabled || loading) return
    
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const res = await createTeam(formData)
    
    if (res.success) {
      (e.target as HTMLFormElement).reset()
    } else {
      setError(res.error!)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h3 className="text-lg font-medium text-white">Cadastrar Dupla</h3>
      
      {error && (
        <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <input type="hidden" name="championshipId" value={championshipId} />

      <div>
        <label className="block text-sm font-medium text-zinc-300">Nome da Dupla</label>
        <input 
          type="text" 
          name="teamName" 
          required 
          disabled={disabled || loading}
          className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          placeholder="Ex: Os Reis do Truco"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-300">Jogador 1 (Nome)</label>
          <input 
            type="text" 
            name="player1Name" 
            required 
            disabled={disabled || loading}
            className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            placeholder="Nome do jogador 1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300">Jogador 1 (Telefone opcional)</label>
          <input 
            type="text" 
            name="player1Phone" 
            disabled={disabled || loading}
            className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-300">Jogador 2 (Nome)</label>
          <input 
            type="text" 
            name="player2Name" 
            required 
            disabled={disabled || loading}
            className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            placeholder="Nome do jogador 2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300">Jogador 2 (Telefone opcional)</label>
          <input 
            type="text" 
            name="player2Phone" 
            disabled={disabled || loading}
            className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={disabled || loading}
          className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
        >
          {loading ? "Cadastrando..." : "Cadastrar Dupla"}
        </button>
      </div>
    </form>
  )
}
