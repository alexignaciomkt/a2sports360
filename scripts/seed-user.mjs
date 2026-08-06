import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
  console.log('Criando tenant...')
  const { data: tenant, error: tErr } = await supabase
    .from('tenants')
    .insert({ name: 'Arena Teste' })
    .select()
    .single()
    
  if (tErr) throw tErr
  
  console.log('Criando usuário (auth.users)...')
  const email = 'admin@a2sports.com'
  const password = 'password123'
  const { data: authData, error: aErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })
  
  if (aErr) {
    if (aErr.message.includes('already exists')) {
      console.log('O usuário admin@a2sports.com já existe! Vamos recuperar o ID dele...')
      const { data: users, error: searchErr } = await supabase.auth.admin.listUsers()
      if (searchErr) throw searchErr
      const existingUser = users.users.find(u => u.email === email)
      
      console.log('Atualizando a senha do usuário existente...')
      await supabase.auth.admin.updateUserById(existingUser.id, { password, email_confirm: true })
      
      console.log('Criando/Atualizando profile...')
      const { error: pErr } = await supabase
        .from('profiles')
        .upsert({
          id: existingUser.id,
          tenant_id: tenant.id
        })
        
      if (pErr) throw pErr
    } else {
      throw aErr
    }
  } else {
    console.log('Criando profile...')
    const { error: pErr } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        tenant_id: tenant.id
      })
      
    if (pErr) throw pErr
  }
  
  console.log('\n=======================================')
  console.log('✅ Usuário mockado configurado com sucesso!')
  console.log(`Login: ${email}`)
  console.log(`Senha: ${password}`)
  console.log('=======================================\n')
}

run().catch(console.error)
