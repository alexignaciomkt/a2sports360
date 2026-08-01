"use client"

import { useActionState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createChampionshipAction } from "@/actions/championship.actions"

export default function NewChampionshipPage() {
  const [state, formAction, pending] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      return await createChampionshipAction(formData)
    },
    null
  )

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/championships"
          className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar para Campeonatos
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
          Novo Campeonato
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Preencha os dados abaixo para iniciar um novo evento.
        </p>
      </div>

      <form action={formAction} className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
              Nome do Campeonato
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={3}
              maxLength={100}
              placeholder="Ex: 1º Torneio de Truco A2Sports"
              className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="modality" className="block text-sm font-medium text-zinc-300">
              Modalidade
            </label>
            <select
              id="modality"
              name="modality"
              required
              className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="truco_duplas">Truco em Duplas</option>
            </select>
            <p className="mt-1 text-xs text-zinc-500">
              Outras modalidades estarão disponíveis em breve.
            </p>
          </div>

          <div>
            <label htmlFor="format" className="block text-sm font-medium text-zinc-300">
              Formato
            </label>
            <select
              id="format"
              name="format"
              required
              className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="one_table_demo">Mesa Única (Demonstração)</option>
              <option value="elimination">Torneio Eliminatório</option>
            </select>
          </div>

          <div>
            <label htmlFor="target_score" className="block text-sm font-medium text-zinc-300">
              Pontuação Final (Queda)
            </label>
            <input
              id="target_score"
              name="target_score"
              type="number"
              required
              min={1}
              max={100}
              defaultValue={12}
              className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Pontuação necessária para vencer a partida.
            </p>
          </div>
        </div>

        {state?.error && (
          <div className="rounded-md bg-red-900/30 p-3 text-sm text-red-400">
            {state.error}
          </div>
        )}

        <div className="flex items-center justify-end gap-4 border-t border-zinc-800 pt-6">
          <Link
            href="/championships"
            className="text-sm font-semibold text-zinc-300 hover:text-white"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Salvando..." : "Criar Campeonato"}
          </button>
        </div>
      </form>
    </div>
  )
}
