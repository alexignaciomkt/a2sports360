import { createClient } from "@/lib/supabase/server"

export async function requireTenant() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Não autorizado.")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single()

  if (profileError || !profile?.tenant_id) {
    throw new Error("Perfil de organizador não encontrado. Entre em contato com o suporte.")
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", profile.tenant_id)
    .single()

  if (tenantError || !tenant) {
    throw new Error("Tenant não encontrado.")
  }

  return {
    user,
    tenantId: profile.tenant_id,
    tenantName: tenant.name,
  }
}
