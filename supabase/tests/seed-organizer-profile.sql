-- supabase/tests/seed-organizer-profile.sql
-- Este script deve ser executado MANUALMENTE para preparar um organizador de testes.
-- NÃO execute em produção sem validação rigorosa.
-- NÃO execute como parte do build automatizado.

-- INSTRUÇÕES:
-- 1. Crie um usuário manualmente na interface do Supabase Auth (Authentication -> Add user -> Create new user).
-- 2. Copie o "User UID" gerado.
-- 3. Substitua 'SUBSTITUA-AQUI-PELO-UUID-DO-AUTH' abaixo pelo UUID copiado.
-- 4. Execute este script no SQL Editor do Supabase.

BEGIN;

DO $$
DECLARE
    v_user_id uuid := 'SUBSTITUA-AQUI-PELO-UUID-DO-AUTH';
    v_tenant_id uuid;
BEGIN
    -- Validar se o uuid não foi substituído
    IF v_user_id::text = 'SUBSTITUA-AQUI-PELO-UUID-DO-AUTH' OR v_user_id IS NULL THEN
        RAISE EXCEPTION 'Você deve substituir a variável v_user_id com um UUID válido do auth.users.';
    END IF;

    -- Verificar se o usuário existe em auth.users (necessita permissão, mas como rodamos como admin, OK)
    -- IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    --     RAISE EXCEPTION 'O usuário com ID % não existe no auth.users', v_user_id;
    -- END IF;

    -- 1. Criar um Tenant de teste de forma idempotente
    -- Verifica se já existe um tenant para este teste (usamos um nome padrão)
    SELECT id INTO v_tenant_id FROM public.tenants WHERE name = 'Tenant de Testes A2Sports360' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        INSERT INTO public.tenants (name)
        VALUES ('Tenant de Testes A2Sports360')
        RETURNING id INTO v_tenant_id;
        
        RAISE NOTICE 'Novo tenant criado: %', v_tenant_id;
    ELSE
        RAISE NOTICE 'Tenant de teste já existe: %', v_tenant_id;
    END IF;

    -- 2. Criar ou atualizar o Profile do usuário
    -- Usamos UPSERT (ON CONFLICT) assumindo que id é a Primary Key de profiles
    INSERT INTO public.profiles (id, tenant_id)
    VALUES (v_user_id, v_tenant_id)
    ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id;

    RAISE NOTICE 'Profile do organizador (%) atualizado/criado e associado ao tenant %.', v_user_id, v_tenant_id;
END $$;

COMMIT;
