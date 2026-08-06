"use client"

import { useState } from "react"
import { TeamModal } from "./team-modal"
import { Plus } from "lucide-react"

export function NewTeamButton({ championshipId }: { championshipId: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group relative flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border-light bg-transparent py-16 hover:border-primary hover:bg-primary/5 transition-all duration-300"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 shadow-xl">
          <Plus className="h-8 w-8" />
        </div>
        <span className="mt-6 text-lg font-medium text-foreground-muted group-hover:text-primary transition-colors duration-300">
          Nova Dupla
        </span>
      </button>

      <TeamModal 
        championshipId={championshipId} 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  )
}
