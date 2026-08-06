"use client"

import { useActionState } from "react"
import { login } from "@/actions/auth.actions"
import { AppCard } from "@/components/ui/app-card"
import { AppButton } from "@/components/ui/app-button"
import { Mail, Lock } from "lucide-react"

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      return await login(formData)
    },
    null
  )

  return (
    <div 
      className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: "url('/brand/background_tela_login3.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >

      {/* Camada 2: Radial Gradient Neon Discreto */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Card Principal */}
      <div className="w-full max-w-[420px] relative z-10 animate-in fade-in duration-700 zoom-in-95">
        <AppCard 
          elevated 
          className="p-8 sm:p-10 backdrop-blur-xl bg-black/40 border border-white/10 rounded-3xl shadow-2xl overflow-hidden hover:shadow-[0_20px_50px_-12px_rgba(159,251,0,0.25)] hover:-translate-y-1 transition-all duration-500"
        >
          <div className="mb-8 flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              alt="A2 Sports 360" 
              className="h-40 sm:h-48 w-auto mb-6 object-contain mix-blend-screen drop-shadow-[0_0_15px_rgba(159,251,0,0.15)]" 
              src="/brand/logo-dark.png" 
            />
            <h1 className="text-[9px] sm:text-[10px] whitespace-nowrap text-primary font-bold uppercase tracking-[0.25em] mb-3">
              Organize Campeonatos Profissionais
            </h1>
            <p className="text-[11px] sm:text-xs text-foreground-muted/90 font-medium leading-relaxed px-2">
              Gerencie equipes, locais, partidas e resultados em um único lugar.
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            <div className="space-y-1.5 group">
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted group-focus-within:text-primary transition-colors ml-1"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-foreground-muted group-focus-within:text-primary transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="seu@email.com"
                  className="block w-full rounded-2xl border border-white/5 bg-[#0a0b0c]/80 pl-11 pr-4 py-3.5 text-foreground placeholder-foreground-muted/50 focus:border-primary/50 focus:bg-[#0a0b0c] focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5 group">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted group-focus-within:text-primary transition-colors ml-1"
              >
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-foreground-muted group-focus-within:text-primary transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="block w-full rounded-2xl border border-white/5 bg-[#0a0b0c]/80 pl-11 pr-4 py-3.5 text-foreground placeholder-foreground-muted/50 focus:border-primary/50 focus:bg-[#0a0b0c] focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            {state?.error && (
              <div className="rounded-2xl bg-danger-muted/20 p-4 text-sm text-danger border border-danger/20 font-medium animate-in slide-in-from-top-2">
                {state.error}
              </div>
            )}

            <div className="pt-2">
              <AppButton
                type="submit"
                isLoading={pending}
                className="w-full h-14 text-base rounded-2xl bg-primary text-primary-foreground font-bold hover:shadow-[0_0_20px_rgba(159,251,0,0.25)] hover:bg-primary-hover active:scale-[0.97] transition-all"
              >
                Acessar Plataforma
              </AppButton>
            </div>
          </form>
        </AppCard>
      </div>
    </div>
  )
}
