"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createTeam } from "./actions"

interface TeamModalProps {
  championshipId: string
  isOpen: boolean
  onClose: () => void
}

export function TeamModal({ championshipId, isOpen, onClose }: TeamModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const router = useRouter()

  // Manage native dialog open state
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else if (!isOpen && dialog.open) {
      dialog.close()
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle ESC key and backdrop click native behaviors
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleCancel = (e: Event) => {
      e.preventDefault()
      if (!loading) {
        onClose()
      }
    }

    const handleClick = (e: MouseEvent) => {
      if (dialogRef.current && e.target === dialogRef.current && !loading) {
        onClose()
      }
    }

    dialog.addEventListener('cancel', handleCancel)
    dialog.addEventListener('click', handleClick)

    return () => {
      dialog.removeEventListener('cancel', handleCancel)
      dialog.removeEventListener('click', handleClick)
    }
  }, [onClose, loading])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const res = await createTeam(formData)
    
    if (res.success) {
      (e.target as HTMLFormElement).reset()
      onClose()
      // Força a UI a atualizar com os novos dados sem dar reload completo
      router.refresh()
    } else {
      setError(res.error!)
    }
    setLoading(false)
  }

  return (
    <dialog 
      ref={dialogRef}
      className="backdrop:bg-black/80 backdrop:backdrop-blur-sm bg-transparent w-full max-w-2xl mx-auto p-4 m-auto rounded-2xl shadow-2xl open:animate-in open:fade-in open:zoom-in-95 duration-200"
      aria-labelledby="modal-title"
    >
      <div className="bg-surface-elevated border border-border rounded-2xl p-8 shadow-2xl w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 id="modal-title" className="text-2xl font-bold text-foreground">Nova Dupla</h2>
          <button 
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-foreground-muted hover:text-foreground disabled:opacity-50 transition-colors"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-danger/10 border border-danger/20 p-4 text-sm text-danger-muted">
              {error}
            </div>
          )}

          <input type="hidden" name="championshipId" value={championshipId} />

          <div>
            <label className="block text-sm font-medium text-foreground-muted mb-2">Nome da Dupla</label>
            <input 
              type="text" 
              name="teamName" 
              required 
              disabled={loading}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-border-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-colors"
              placeholder="Ex: Os Reis do Truco"
              autoFocus
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-2">Jogador 1</label>
              <input 
                type="text" 
                name="player1Name" 
                required 
                disabled={loading}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-border-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-colors"
                placeholder="Nome"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-2">Contato 1 <span className="opacity-50">(opcional)</span></label>
              <input 
                type="text" 
                name="player1Phone" 
                disabled={loading}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-border-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-colors"
                placeholder="WhatsApp"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-2">Jogador 2</label>
              <input 
                type="text" 
                name="player2Name" 
                required 
                disabled={loading}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-border-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-colors"
                placeholder="Nome"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-2">Contato 2 <span className="opacity-50">(opcional)</span></label>
              <input 
                type="text" 
                name="player2Phone" 
                disabled={loading}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-border-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-colors"
                placeholder="WhatsApp"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? "Salvando..." : "Salvar Dupla"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  )
}
