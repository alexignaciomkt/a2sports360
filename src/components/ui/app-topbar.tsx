"use client"

import * as React from "react"
import { Search, Bell, HelpCircle, LogOut, Menu } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar-provider"

export function AppTopbar({ logoutAction }: { logoutAction: () => Promise<void> }) {
  const { setMobileOpen } = useSidebar()

  return (
    <header className="sticky top-0 h-20 bg-background/70 backdrop-blur-xl z-40 px-4 md:px-10 flex items-center justify-between border-b border-border/10 shrink-0">
      
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-surface hover:bg-surface-high border border-border/10 text-foreground-muted hover:text-primary transition-all duration-300 shadow-sm"
          aria-label="Abrir menu"
          aria-expanded={false}
          aria-controls="sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4 bg-surface/50 px-5 py-2.5 rounded-2xl border border-border/20 w-48 md:w-[400px] shadow-sm hover:border-primary/30 hover:shadow-[0_0_15px_rgba(159,251,0,0.05)] hover:bg-surface transition-all duration-300 group focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
          <Search className="text-foreground-muted h-5 w-5 group-focus-within:text-primary transition-colors duration-300 shrink-0" />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm w-full text-foreground placeholder:text-foreground-muted/40 font-medium"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-5">
        <button className="relative w-11 h-11 flex items-center justify-center rounded-xl bg-surface hover:bg-surface-high border border-border/10 text-foreground-muted hover:text-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <Bell className="h-[22px] w-[22px]" />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-primary rounded-full ring-[3px] ring-surface animate-pulse shadow-[0_0_8px_rgba(159,251,0,0.8)]"></span>
        </button>
        <button className="hidden md:flex w-11 h-11 items-center justify-center rounded-xl bg-surface hover:bg-surface-high border border-border/10 text-foreground-muted hover:text-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <HelpCircle className="h-[22px] w-[22px]" />
        </button>
        <div className="h-6 w-px bg-border/30 mx-1 hidden md:block"></div>
        <form>
          <button
            type="submit"
            title="Sair"
            formAction={logoutAction}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface hover:bg-danger-muted/20 border border-border/10 text-foreground-muted hover:text-danger hover:border-danger/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            <LogOut className="h-[22px] w-[22px]" />
          </button>
        </form>
      </div>
    </header>
  )
}


