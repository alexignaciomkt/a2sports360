"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Trophy, Users, Network, Settings, User, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar-provider"

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Campeonatos", href: "/championships", icon: Trophy },
  { name: "Equipes", href: "/teams", icon: Users },
  { name: "Chaves", href: "/brackets", icon: Network },
]

export function AppSidebar({ tenantName }: { tenantName: string }) {
  const pathname = usePathname()
  const { isCollapsed, isMobileOpen, setMobileOpen, toggleCollapsed } = useSidebar()

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside 
        className={cn(
          "fixed md:sticky top-0 h-screen bg-surface z-50 flex flex-col border-r border-border/20 shadow-2xl transition-all duration-300 ease-in-out shrink-0",
          // Mobile state
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Desktop state
          isCollapsed ? "md:w-[84px]" : "md:w-72",
          // Fixed width on mobile (always expanded visually)
          "w-72"
        )}
      >
        <div className="flex items-center justify-center h-32 shrink-0 relative w-full">
          {/* Logo Symbol */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            alt="A2 Sports 360 Logo" 
            className={cn(
              "w-auto max-w-[90%] object-contain drop-shadow-[0_0_15px_rgba(159,251,0,0.15)] transition-transform duration-300 hover:scale-105 shrink-0",
              isCollapsed ? "h-12" : "h-20"
            )}
            src="/brand/logo-dark.png" 
          />

          {/* Toggle Button */}
          <button
            onClick={toggleCollapsed}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface-elevated border border-border/30 rounded-full items-center justify-center text-foreground-muted hover:text-primary hover:border-primary/50 hover:shadow-[0_0_10px_rgba(159,251,0,0.2)] transition-all z-10"
            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
          </button>
        </div>
        
        <nav className={cn("flex-1 space-y-2 mt-4 overflow-y-auto overflow-x-hidden", isCollapsed ? "px-3" : "px-5")}>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-xl transition-all duration-300 group/link font-medium text-sm relative overflow-hidden",
                    isCollapsed ? "justify-center py-3.5 px-0 w-14 mx-auto" : "px-4 py-3.5",
                    isActive
                      ? "bg-primary/10 text-primary font-bold border border-primary/20 shadow-[0_0_20px_rgba(159,251,0,0.05)]"
                      : "text-foreground-muted hover:bg-surface-high hover:text-foreground hover:translate-x-1"
                  )}
                  aria-label={item.name}
                >
                  {isActive && (
                    <div className={cn(
                      "absolute top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(159,251,0,0.8)]",
                      isCollapsed ? "left-0 rounded-r-full" : "left-0 rounded-r-full"
                    )} />
                  )}
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-300 shrink-0", 
                    isActive ? "text-primary" : "group-hover/link:text-primary group-hover/link:scale-110",
                    !isCollapsed && "mr-4"
                  )} />
                  <span className={cn(
                    "relative z-10 whitespace-nowrap transition-all duration-300",
                    isCollapsed ? "sr-only" : "opacity-100"
                  )}>
                    {item.name}
                  </span>
                </Link>
                
                {/* CSS Tooltip for Collapsed Mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-surface-elevated border border-border/30 rounded-lg text-sm font-medium text-foreground opacity-0 -translate-x-2 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 z-50 whitespace-nowrap shadow-xl">
                    {item.name}
                  </div>
                )}
              </div>
            )
          })}

          <div className="pt-6 mt-6 border-t border-border/10 relative group">
            <Link
              href="/settings"
              className={cn(
                "flex items-center rounded-xl text-foreground-muted hover:bg-surface-high hover:text-foreground hover:translate-x-1 transition-all duration-300 group/link font-medium text-sm overflow-hidden",
                isCollapsed ? "justify-center py-3.5 px-0 w-14 mx-auto" : "px-4 py-3.5"
              )}
              aria-label="Configurações"
            >
              <Settings className={cn(
                "h-5 w-5 group-hover/link:text-primary transition-transform duration-300 group-hover/link:rotate-90 shrink-0",
                !isCollapsed && "mr-4"
              )} />
              <span className={cn(
                "whitespace-nowrap transition-all duration-300",
                isCollapsed ? "sr-only" : "opacity-100"
              )}>
                Configurações
              </span>
            </Link>
            
            {isCollapsed && (
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-surface-elevated border border-border/30 rounded-lg text-sm font-medium text-foreground opacity-0 -translate-x-2 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 z-50 whitespace-nowrap shadow-xl">
                Configurações
              </div>
            )}
          </div>
        </nav>

        <div className={cn(
          "mb-6 mx-auto transition-all duration-300 group cursor-default",
          isCollapsed ? "w-14" : "w-auto mx-5 p-5 rounded-2xl bg-surface-high flex items-center gap-4 border border-border/10 shadow-lg hover:border-primary/30"
        )}>
          <div className={cn(
            "rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20 group-hover:shadow-[0_0_15px_rgba(159,251,0,0.15)] transition-all mx-auto",
            isCollapsed ? "w-10 h-10" : "w-11 h-11"
          )}>
            <User className={cn("text-primary", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
          </div>
          
          <div className={cn(
            "overflow-hidden transition-all duration-300",
            isCollapsed ? "sr-only" : "opacity-100 w-auto"
          )}>
            <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{tenantName}</p>
            <p className="text-[10px] text-foreground-muted font-bold uppercase tracking-widest mt-0.5">Organizador</p>
          </div>
        </div>
      </aside>
    </>
  )
}

