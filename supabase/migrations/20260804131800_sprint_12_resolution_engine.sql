-- Migration: 20260804131800_sprint_12_resolution_engine.sql

-- 1. Alterar tabela matches
ALTER TABLE public.matches ADD COLUMN resolved_at TIMESTAMPTZ NULL;
ALTER TABLE public.matches ADD COLUMN resolution_type TEXT NULL CHECK (resolution_type IN ('confirmed'));

-- 2. Criar a RPC Transacional
CREATE OR REPLACE FUNCTION public.resolve_finished_game(
    p_tenant_id UUID,
    p_championship_id UUID,
    p_encounter_id UUID,
    p_match_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_championship public.championships%ROWTYPE;
    v_encounter public.encounters%ROWTYPE;
    v_match public.matches%ROWTYPE;
    v_table public.game_tables%ROWTYPE;
    v_new_team_a_wins INT;
    v_new_team_b_wins INT;
    v_next_game_number INT;
    v_next_game_id UUID;
    v_winner_team_id UUID;
BEGIN
    -- 1. Bloqueio FOR UPDATE em Ordem Determinística para evitar deadlocks
    SELECT * INTO v_championship FROM public.championships WHERE id = p_championship_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'championship_not_found'; END IF;
    IF v_championship.tenant_id != p_tenant_id THEN RAISE EXCEPTION 'championship_not_found'; END IF;

    SELECT * INTO v_encounter FROM public.encounters WHERE id = p_encounter_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'encounter_not_found'; END IF;
    IF v_encounter.championship_id != p_championship_id THEN RAISE EXCEPTION 'encounter_not_found'; END IF;

    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'game_not_found'; END IF;
    IF v_match.encounter_id != p_encounter_id THEN RAISE EXCEPTION 'game_not_found'; END IF;

    -- Bloquear as outras quedas do encounter (Garante integridade de game_number e leitura)
    PERFORM 1 FROM public.matches WHERE encounter_id = p_encounter_id FOR UPDATE;

    SELECT * INTO v_table FROM public.game_tables WHERE id = v_match.table_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'resource_not_found'; END IF;

    -- 2. Validações de Estado
    IF v_match.status != 'finished' THEN RAISE EXCEPTION 'game_not_finished'; END IF;
    IF v_match.winner_team_id IS NULL THEN RAISE EXCEPTION 'game_without_winner'; END IF;
    IF v_match.winner_team_id != v_encounter.team_a_id AND v_match.winner_team_id != v_encounter.team_b_id THEN 
        RAISE EXCEPTION 'winner_not_in_encounter'; 
    END IF;
    
    -- 3. Idempotência
    IF v_match.resolved_at IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'idempotent', true,
            'outcome', CASE WHEN v_encounter.status = 'finished' THEN 'encounter_finished' ELSE 'next_game_started' END,
            'encounter_id', p_encounter_id,
            'resolved_game_id', p_match_id
        );
    END IF;

    IF v_encounter.status != 'in_progress' THEN RAISE EXCEPTION 'encounter_not_in_progress'; END IF;
    
    IF v_table.status != 'occupied' THEN RAISE EXCEPTION 'inconsistent_operational_state'; END IF;
    IF v_table.current_encounter_id != p_encounter_id THEN RAISE EXCEPTION 'inconsistent_operational_state'; END IF;
    IF v_table.current_match_id != p_match_id THEN RAISE EXCEPTION 'inconsistent_operational_state'; END IF;

    IF EXISTS (
        SELECT 1 FROM public.matches 
        WHERE encounter_id = p_encounter_id 
          AND id != p_match_id 
          AND status IN ('scheduled', 'in_progress')
    ) THEN
        RAISE EXCEPTION 'another_game_active';
    END IF;

    -- 4. Somar Vitória Atômica
    v_new_team_a_wins := v_encounter.team_a_wins;
    v_new_team_b_wins := v_encounter.team_b_wins;

    IF v_match.winner_team_id = v_encounter.team_a_id THEN
        v_new_team_a_wins := v_new_team_a_wins + 1;
    ELSE
        v_new_team_b_wins := v_new_team_b_wins + 1;
    END IF;

    IF v_new_team_a_wins > v_encounter.wins_required OR v_new_team_b_wins > v_encounter.wins_required THEN
        RAISE EXCEPTION 'invalid_series_score';
    END IF;

    -- Resolver a Queda
    UPDATE public.matches
    SET resolved_at = NOW(),
        resolution_type = 'confirmed',
        updated_at = NOW()
    WHERE id = p_match_id;

    -- 5. Caso Encounter Finalizado
    IF v_new_team_a_wins >= v_encounter.wins_required OR v_new_team_b_wins >= v_encounter.wins_required THEN
        v_winner_team_id := CASE WHEN v_new_team_a_wins >= v_encounter.wins_required THEN v_encounter.team_a_id ELSE v_encounter.team_b_id END;
        
        UPDATE public.encounters
        SET team_a_wins = v_new_team_a_wins,
            team_b_wins = v_new_team_b_wins,
            status = 'finished',
            winner_team_id = v_winner_team_id,
            finished_at = NOW(),
            updated_at = NOW()
        WHERE id = p_encounter_id;

        UPDATE public.game_tables
        SET status = 'available',
            current_encounter_id = NULL,
            current_match_id = NULL
        WHERE id = v_table.id;

        -- Expirar TODAS as sessões do encounter (mesários finalizados)
        UPDATE public.match_sessions
        SET status = 'expired'
        WHERE match_id IN (SELECT id FROM public.matches WHERE encounter_id = p_encounter_id)
          AND status = 'active';

        RETURN jsonb_build_object(
            'success', true,
            'idempotent', false,
            'outcome', 'encounter_finished',
            'encounter_id', p_encounter_id,
            'winner_team_id', v_winner_team_id,
            'resolved_game_id', p_match_id,
            'next_game_id', null,
            'resource_id', v_table.id
        );
    END IF;

    -- 6. Caso Encounter Continua
    UPDATE public.encounters
    SET team_a_wins = v_new_team_a_wins,
        team_b_wins = v_new_team_b_wins,
        updated_at = NOW()
    WHERE id = p_encounter_id;

    SELECT COALESCE(MAX(game_number), 0) + 1 INTO v_next_game_number
    FROM public.matches
    WHERE encounter_id = p_encounter_id;

    INSERT INTO public.matches (
        championship_id, encounter_id, game_number, status, table_id,
        team_a_id, team_b_id, started_at
    ) VALUES (
        p_championship_id, p_encounter_id, v_next_game_number, 'in_progress', v_table.id,
        v_encounter.team_a_id, v_encounter.team_b_id, NOW()
    ) RETURNING id INTO v_next_game_id;

    UPDATE public.game_tables
    SET current_match_id = v_next_game_id
    WHERE id = v_table.id;

    -- Expirar apenas sessões da Queda resolvida, pois a Queda mudou
    UPDATE public.match_sessions
    SET status = 'expired'
    WHERE match_id = p_match_id AND status = 'active';

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'outcome', 'next_game_started',
        'encounter_id', p_encounter_id,
        'resolved_game_id', p_match_id,
        'next_game_id', v_next_game_id,
        'next_game_number', v_next_game_number,
        'resource_id', v_table.id
    );

END;
$$;

-- Revogar acesso público e conceder apenas às roles adequadas
REVOKE EXECUTE ON FUNCTION public.resolve_finished_game(UUID, UUID, UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.resolve_finished_game(UUID, UUID, UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.resolve_finished_game(UUID, UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_finished_game(UUID, UUID, UUID, UUID) TO service_role;
