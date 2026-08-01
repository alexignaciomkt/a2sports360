-- =======================================================
-- TESTES CROSS-TENANT e ANON
-- =======================================================

BEGIN;

-- Limpar estado
DELETE FROM public.profiles;
DELETE FROM public.tenants;
DELETE FROM auth.users;

-- Criar 2 usuarios no Auth
INSERT INTO auth.users (id, instance_id, role, aud) VALUES 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

-- Criar Tenants A e B
INSERT INTO public.tenants (id, name) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tenant A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Tenant B');

-- Vincular Profiles
INSERT INTO public.profiles (id, tenant_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Inserir dados administrativos do Tenant A (como superuser antes de testar)
INSERT INTO public.championships (id, tenant_id, name, format) VALUES 
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Champ A', 'groups');

INSERT INTO public.teams (id, championship_id, name) VALUES 
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Team A1'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Team A2');

INSERT INTO public.game_tables (id, championship_id, number, qr_token) VALUES 
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, 'token-a1');

INSERT INTO public.matches (id, championship_id, table_id, team_a_id, team_b_id) VALUES 
  ('10000000-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');

INSERT INTO public.match_events (id, match_id, sequence, event_type, points_delta) VALUES 
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 1, 'POINT', 1);

-- ==========================================
-- TESTE 1: Usuário do Tenant B não acessa Tenant A
-- ==========================================
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

DO $$
DECLARE
  v_count INT;
BEGIN
  -- LER
  SELECT count(*) INTO v_count FROM public.championships WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  IF v_count > 0 THEN RAISE EXCEPTION 'Falha: Tenant B leu championship do Tenant A'; END IF;

  SELECT count(*) INTO v_count FROM public.teams WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  IF v_count > 0 THEN RAISE EXCEPTION 'Falha: Tenant B leu teams do Tenant A'; END IF;

  SELECT count(*) INTO v_count FROM public.game_tables WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  IF v_count > 0 THEN RAISE EXCEPTION 'Falha: Tenant B leu game_tables do Tenant A'; END IF;

  SELECT count(*) INTO v_count FROM public.matches WHERE id = '10000000-0000-0000-0000-000000000001';
  IF v_count > 0 THEN RAISE EXCEPTION 'Falha: Tenant B leu matches do Tenant A'; END IF;

  SELECT count(*) INTO v_count FROM public.match_events WHERE id = '20000000-0000-0000-0000-000000000002';
  IF v_count > 0 THEN RAISE EXCEPTION 'Falha: Tenant B leu match_events do Tenant A'; END IF;

  -- ATUALIZAR
  UPDATE public.championships SET name = 'Hacked' WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN RAISE EXCEPTION 'Falha: Tenant B atualizou championship do Tenant A'; END IF;

  -- EXCLUIR
  DELETE FROM public.championships WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN RAISE EXCEPTION 'Falha: Tenant B deletou championship do Tenant A'; END IF;
  
  -- INSERIR (Tenant B não tem profile associado ao Tenant A, sua tentativa de usar tenant A viola RLS)
  BEGIN
    INSERT INTO public.championships (id, tenant_id, name, format) VALUES 
      ('30000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Champ B fake', 'groups');
    RAISE EXCEPTION 'Falha: Tenant B inseriu com tenant_id do Tenant A';
  EXCEPTION WHEN OTHERS THEN
    -- Sucesso: Rejeitou
  END;

END
$$;

-- ==========================================
-- TESTE 2: ANON recebe zero linhas
-- ==========================================
RESET role;
SET LOCAL role = 'anon';

DO $$
DECLARE
  v_count INT;
BEGIN
  -- LER tables que antes eram public_read
  SELECT count(*) INTO v_count FROM public.game_tables;
  IF v_count > 0 THEN RAISE EXCEPTION 'Falha: anon leu game_tables'; END IF;

  SELECT count(*) INTO v_count FROM public.matches;
  IF v_count > 0 THEN RAISE EXCEPTION 'Falha: anon leu matches'; END IF;

  SELECT count(*) INTO v_count FROM public.match_events;
  IF v_count > 0 THEN RAISE EXCEPTION 'Falha: anon leu match_events'; END IF;
END
$$;

ROLLBACK;
SELECT 'TESTES CROSS-TENANT E ANON PASSARAM' as result;
