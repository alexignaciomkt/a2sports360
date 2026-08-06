import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { requireTenant } from "@/lib/auth"
import { AppSidebar } from "@/components/ui/app-sidebar"
import { AppTopbar } from "@/components/ui/app-topbar"
import { AppButton } from "@/components/ui/app-button"
import { SidebarProvider } from "@/components/ui/sidebar-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let tenantData
  try {
    tenantData = await requireTenant()
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Não autorizado.") {
      redirect("/login")
    }
    // Profile or tenant missing
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-danger-muted/50 bg-danger-muted/10 p-6 text-center">
          <h2 className="text-xl font-bold text-danger">Acesso Negado</h2>
          <p className="mt-2 text-foreground-muted">{err instanceof Error ? err.message : "Acesso não autorizado."}</p>
          <form action="/login" className="mt-6">
            <AppButton
              variant="outline"
              type="submit"
              formAction={async () => {
                "use server"
                const { logout } = await import("@/actions/auth.actions")
                await logout()
              }}
            >
              Sair e tentar com outra conta
            </AppButton>
          </form>
        </div>
      </div>
    )
  }

  const { tenantName } = tenantData

  const handleLogout = async () => {
    "use server"
    const { logout } = await import("@/actions/auth.actions")
    await logout()
  }

  const cookieStore = await cookies()
  const defaultCollapsed = cookieStore.get("sidebar:collapsed")?.value === "true"

  return (
    <SidebarProvider defaultCollapsed={defaultCollapsed}>
      <AppSidebar tenantName={tenantName} />
      
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 w-full relative">
        <AppTopbar logoutAction={handleLogout} />
        
        <main className="flex-1 pt-8 pb-8 px-4 md:px-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}

