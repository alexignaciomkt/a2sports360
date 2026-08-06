"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

interface SidebarContextType {
  isCollapsed: boolean
  isMobileOpen: boolean
  toggleCollapsed: () => void
  setMobileOpen: (open: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
  defaultCollapsed?: boolean
}

export function SidebarProvider({ children, defaultCollapsed = false }: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)
  const pathname = usePathname()
  const [prevPathname, setPrevPathname] = React.useState(pathname)

  // Close mobile drawer on navigation (recommended pattern)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setIsMobileOpen(false)
  }

  const toggleCollapsed = React.useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev
      // Persist state via cookie
      document.cookie = `sidebar:collapsed=${next}; path=/; max-age=31536000; SameSite=Lax`
      return next
    })
  }, [])

  // Lock body scroll and handle Escape key when mobile drawer is open
  React.useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden"
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsMobileOpen(false)
        }
      }
      
      document.addEventListener("keydown", handleKeyDown)
      return () => {
        document.body.style.overflow = ""
        document.removeEventListener("keydown", handleKeyDown)
      }
    } else {
      document.body.style.overflow = ""
    }
  }, [isMobileOpen])

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobileOpen,
        toggleCollapsed,
        setMobileOpen: setIsMobileOpen,
      }}
    >
      <div className="min-h-screen flex w-full overflow-hidden">
        {children}
      </div>
    </SidebarContext.Provider>
  )
}
