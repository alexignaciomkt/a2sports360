import { redirect } from "next/navigation"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { requireTenant } from "@/lib/auth"

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
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4">
        <div className="w-full max-w-md rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-center">
          <h2 className="text-xl font-bold text-red-500">Acesso Negado</h2>
          <p className="mt-2 text-zinc-300">{err instanceof Error ? err.message : "Acesso não autorizado."}</p>
          <form action="/login" className="mt-6">
            <button
              type="submit"
              formAction={async () => {
                "use server"
                const { logout } = await import("@/actions/auth.actions")
                await logout()
              }}
              className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Sair e tentar com outra conta
            </button>
          </form>
        </div>
      </div>
    )
  }

  const { tenantName } = tenantData

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800 bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-indigo-400">
                A2Sports360
              </Link>
              <div className="flex gap-4">
                <Link
                  href="/dashboard"
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-zinc-800 hover:text-white"
                >
                  Visão Geral
                </Link>
                <Link
                  href="/championships"
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-zinc-800 hover:text-white"
                >
                  Campeonatos
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-400">{tenantName}</span>
              <form>
                <button
                  type="submit"
                  title="Sair"
                  formAction={async () => {
                    "use server"
                    const { logout } = await import("@/actions/auth.actions")
                    await logout()
                  }}
                  className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
