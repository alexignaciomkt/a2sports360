-- Migration: Sprint 10 - Correção Arquitetural do Resource Engine

-- 1. Adicionar Vínculo com Confronto no Recurso Físico
ALTER TABLE public.game_tables
ADD COLUMN current_encounter_id UUID REFERENCES public.encounters(id) ON DELETE SET NULL;

-- 2. Índice Parcial de Unicidade: Um Encounter só pode ocupar uma mesa por vez
CREATE UNIQUE INDEX idx_game_tables_unique_encounter ON public.game_tables(current_encounter_id)
WHERE current_encounter_id IS NOT NULL;

-- 3. Nova RPC Transacional: Despacho de Confronto
CREATE OR REPLACE FUNCTION public.dispatch_encounter_to_resource(
    p_tenant_id UUID,
    p_championship_id UUID,
    p_encounter_id UUID,
    p_resource_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_encounter public.encounters%ROWTYPE;
    v_table public.game_tables%ROWTYPE;
    v_first_match public.matches%ROWTYPE;
    v_stage_id UUID;
    v_now TIMESTAMPTZ := now();
BEGIN
    -- Validar a Mesa (Resource) com FOR UPDATE
    SELECT * INTO v_table FROM public.game_tables
    WHERE id = p_resource_id AND championship_id = p_championship_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mesa/Recurso não encontrado no campeonato.';
    END IF;

    -- Validar Confronto (Encounter) com FOR UPDATE
    SELECT * INTO v_encounter FROM public.encounters
    WHERE id = p_encounter_id AND championship_id = p_championship_id AND tenant_id = p_tenant_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Confronto não encontrado ou não pertence a este tenant.';
    END IF;

    -- Validar Stage
    SELECT tournament_stage_id INTO v_stage_id FROM public.encounters WHERE id = p_encounter_id;
    -- tenant_id already checked in v_encounter selection

    -- Localizar a Queda 1 (Active Game) com FOR UPDATE
    SELECT * INTO v_first_match FROM public.matches
    WHERE encounter_id = p_encounter_id AND game_number = 1 AND status = 'scheduled' AND table_id IS NULL FOR UPDATE;

    IF NOT FOUND THEN
        -- Verify if it's an idempotent request with rigid state validation
        IF v_table.current_encounter_id = p_encounter_id 
           AND v_table.status = 'occupied' 
           AND v_encounter.status = 'in_progress' THEN
           
           -- Check if there is a match in progress in this table
           SELECT * INTO v_first_match FROM public.matches
           WHERE encounter_id = p_encounter_id AND status = 'in_progress' AND table_id = p_resource_id;
           
           IF FOUND AND v_table.current_match_id = v_first_match.id THEN
               RETURN jsonb_build_object('success', true, 'idempotent', true, 'encounter_id', p_encounter_id, 'active_game_id', v_first_match.id, 'resource_id', p_resource_id);
           END IF;
        END IF;

        RAISE EXCEPTION 'INCONSISTENT_OPERATIONAL_STATE';
    END IF;

    -- Validação: Se a mesa não estiver disponível ou já tiver outro confronto
    IF v_table.status <> 'available' OR v_table.current_encounter_id IS NOT NULL OR v_table.current_match_id IS NOT NULL THEN
        RAISE EXCEPTION 'INCONSISTENT_OPERATIONAL_STATE';
    END IF;

    -- Validação: Se o confronto não estiver agendado
    IF v_encounter.status <> 'scheduled' THEN
        RAISE EXCEPTION 'INCONSISTENT_OPERATIONAL_STATE';
    END IF;

    -- Validação de equipes
    IF v_first_match.team_a_id <> v_encounter.team_a_id OR v_first_match.team_b_id <> v_encounter.team_b_id THEN
        RAISE EXCEPTION 'INCONSISTENT_OPERATIONAL_STATE';
    END IF;

    -- Update Confronto
    UPDATE public.encounters
    SET status = 'in_progress', started_at = v_now, updated_at = v_now
    WHERE id = p_encounter_id;

    -- Update Queda 1
    UPDATE public.matches
    SET status = 'in_progress', started_at = v_now, table_id = p_resource_id, updated_at = v_now
    WHERE id = v_first_match.id;

    -- Update Recurso Físico
    UPDATE public.game_tables
    SET status = 'occupied',
        current_encounter_id = p_encounter_id,
        current_match_id = v_first_match.id
    WHERE id = p_resource_id;

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'encounter_id', p_encounter_id,
        'active_game_id', v_first_match.id,
        'resource_id', p_resource_id
    );
END;
$$;

-- Permissões da Nova RPC
REVOKE EXECUTE ON FUNCTION public.dispatch_encounter_to_resource(UUID, UUID, UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.dispatch_encounter_to_resource(UUID, UUID, UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.dispatch_encounter_to_resource(UUID, UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_encounter_to_resource(UUID, UUID, UUID, UUID) TO service_role;


-- 4. Re-criar register_match_event adaptada para Encounters
CREATE OR REPLACE FUNCTION public.register_match_event(
    p_device_id TEXT,
    p_event_type TEXT,
    p_match_id UUID,
    p_metadata JSONB,
    p_points_delta INT,
    p_session_token_hash TEXT,
    p_team_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_match public.matches%ROWTYPE;
    v_session public.match_sessions%ROWTYPE;
    v_target_score INT;
    v_new_sequence INT;
    v_new_team_a_score INT;
    v_new_team_b_score INT;
    v_winner_team_id UUID := NULL;
    v_is_team_a BOOLEAN;
BEGIN
    -- 1. Validar a sessão CONTROL
    SELECT * INTO v_session
    FROM public.match_sessions
    WHERE match_id = p_match_id
      AND session_token_hash = p_session_token_hash
      AND role = 'CONTROL'
      AND status = 'active'
      AND expires_at > NOW();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'invalid_or_expired_session';
    END IF;

    -- 2 e 3. Bloquear a linha da partida com FOR UPDATE
    SELECT * INTO v_match
    FROM public.matches
    WHERE id = p_match_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'match_not_found';
    END IF;

    -- 4. Validar que a partida está in_progress
    IF v_match.status != 'in_progress' THEN
        RAISE EXCEPTION 'match_not_in_progress';
    END IF;

    -- 5. Validar se o team_id pertence à partida
    IF p_team_id = v_match.team_a_id THEN
        v_is_team_a := true;
    ELSIF p_team_id = v_match.team_b_id THEN
        v_is_team_a := false;
    ELSE
        RAISE EXCEPTION 'team_not_in_match';
    END IF;

    -- 6. Aceitar apenas pontos válidos no Truco: 1, 3, 6, 9 ou 12
    IF p_event_type IN ('point_scored', 'truco_accepted', 'seis_accepted', 'nove_accepted', 'doze_accepted') THEN
        IF p_points_delta NOT IN (1, 3, 6, 9, 12) THEN
            RAISE EXCEPTION 'invalid_points_delta';
        END IF;
    END IF;

    -- 7. Calcular a próxima sequence
    SELECT COALESCE(MAX(sequence), 0) + 1 INTO v_new_sequence
    FROM public.match_events
    WHERE match_id = p_match_id;

    -- 8. Inserir match_event
    INSERT INTO public.match_events (
        match_id, event_type, team_id, points_delta, sequence, device_id, metadata
    ) VALUES (
        p_match_id, p_event_type, p_team_id, p_points_delta, v_new_sequence, p_device_id, p_metadata
    );

    -- 9. Atualizar o placar correto (pontuação cumulativa)
    v_new_team_a_score := v_match.team_a_score;
    v_new_team_b_score := v_match.team_b_score;

    IF v_is_team_a THEN
        v_new_team_a_score := v_new_team_a_score + p_points_delta;
    ELSE
        v_new_team_b_score := v_new_team_b_score + p_points_delta;
    END IF;

    -- Buscar target score seguro (Sprint 08 moveu para championship_settings, legado em championships)
    SELECT target_score INTO v_target_score FROM public.championships WHERE id = v_match.championship_id;
    IF v_target_score IS NULL THEN
        SELECT target_score INTO v_target_score FROM public.championship_settings WHERE championship_id = v_match.championship_id;
    END IF;
    IF v_target_score IS NULL THEN
        v_target_score := 12;
    END IF;

    -- 12. Finalizar a partida se uma dupla atingir ou ultrapassar o target_score
    IF v_new_team_a_score >= v_target_score THEN
        v_winner_team_id := v_match.team_a_id;
    ELSIF v_new_team_b_score >= v_target_score THEN
        v_winner_team_id := v_match.team_b_id;
    END IF;

    IF v_winner_team_id IS NOT NULL THEN
        -- Atualizar Match
        UPDATE public.matches
        SET team_a_score = v_new_team_a_score,
            team_b_score = v_new_team_b_score,
            status = 'finished',
            winner_team_id = v_winner_team_id,
            finished_at = NOW(),
            updated_at = NOW()
        WHERE id = p_match_id;

        -- SE houver Encounter (Sprint 09+): NÃO liberar Mesa, manter Ocupada.
        -- SE for legado (sem encounter): Liberar Mesa e expirar sessão.
        IF v_match.encounter_id IS NULL THEN
            UPDATE public.game_tables
            SET status = 'available',
                current_match_id = NULL
            WHERE id = v_match.table_id;

            UPDATE public.match_sessions
            SET status = 'expired'
            WHERE match_id = p_match_id AND role = 'CONTROL';
        END IF;

    ELSE
        -- Apenas atualiza placar
        UPDATE public.matches
        SET team_a_score = v_new_team_a_score,
            team_b_score = v_new_team_b_score,
            updated_at = NOW()
        WHERE id = p_match_id;
    END IF;

    RETURN jsonb_build_object(
        'match_id', p_match_id,
        'team_a_score', v_new_team_a_score,
        'team_b_score', v_new_team_b_score,
        'status', CASE WHEN v_winner_team_id IS NOT NULL THEN 'finished' ELSE 'in_progress' END,
        'winner_team_id', v_winner_team_id
    );
END;
$$;


-- 5. Re-criar undo_match_event adaptada para Encounters
CREATE OR REPLACE FUNCTION public.undo_match_event(
    p_match_id UUID,
    p_session_token_hash TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_match public.matches%ROWTYPE;
    v_session public.match_sessions%ROWTYPE;
    v_last_event public.match_events%ROWTYPE;
    v_new_team_a_score INT;
    v_new_team_b_score INT;
    v_is_team_a BOOLEAN;
BEGIN
    -- 1. Validar a sessão CONTROL
    SELECT * INTO v_session
    FROM public.match_sessions
    WHERE match_id = p_match_id
      AND session_token_hash = p_session_token_hash
      AND role = 'CONTROL'
      AND status = 'active'
      AND expires_at > NOW();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'invalid_or_expired_session';
    END IF;

    -- 2. Bloquear a linha da partida com FOR UPDATE
    SELECT * INTO v_match
    FROM public.matches
    WHERE id = p_match_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'match_not_found';
    END IF;

    -- 3. Localizar o último match_event válido
    SELECT * INTO v_last_event
    FROM public.match_events
    WHERE match_id = p_match_id AND event_type NOT LIKE 'undo_%'
      AND NOT EXISTS (
          SELECT 1 FROM public.match_events 
          WHERE match_id = p_match_id AND metadata->>'undone_sequence' = public.match_events.sequence::text
      )
    ORDER BY sequence DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'no_event_to_undo';
    END IF;

    -- 4. Registrar o evento UNDO
    INSERT INTO public.match_events (
        match_id, event_type, team_id, points_delta, sequence, device_id, metadata
    ) VALUES (
        p_match_id, 
        'undo_' || v_last_event.event_type, 
        v_last_event.team_id, 
        -v_last_event.points_delta, 
        (SELECT COALESCE(MAX(sequence), 0) + 1 FROM public.match_events WHERE match_id = p_match_id), 
        NULL, 
        jsonb_build_object('undone_sequence', v_last_event.sequence)
    );

    -- 5. Atualizar o placar
    v_new_team_a_score := v_match.team_a_score;
    v_new_team_b_score := v_match.team_b_score;

    IF v_last_event.team_id = v_match.team_a_id THEN
        v_new_team_a_score := v_new_team_a_score - v_last_event.points_delta;
    ELSIF v_last_event.team_id = v_match.team_b_id THEN
        v_new_team_b_score := v_new_team_b_score - v_last_event.points_delta;
    END IF;

    -- Se estava finalizado, reabrir
    IF v_match.status = 'finished' THEN
        UPDATE public.matches
        SET team_a_score = v_new_team_a_score,
            team_b_score = v_new_team_b_score,
            status = 'in_progress',
            winner_team_id = NULL,
            finished_at = NULL,
            updated_at = NOW()
        WHERE id = p_match_id;

        IF v_match.encounter_id IS NULL THEN
            -- Legado: Reativar mesa livre
            UPDATE public.game_tables
            SET status = 'occupied',
                current_match_id = p_match_id
            WHERE id = v_match.table_id;
            
            -- Reativar sessão (caso tivesse expirado no register)
            UPDATE public.match_sessions
            SET status = 'active'
            WHERE match_id = p_match_id AND role = 'CONTROL' AND session_token_hash = p_session_token_hash;
        END IF;
    ELSE
        UPDATE public.matches
        SET team_a_score = v_new_team_a_score,
            team_b_score = v_new_team_b_score,
            updated_at = NOW()
        WHERE id = p_match_id;
    END IF;

    RETURN jsonb_build_object(
        'match_id', p_match_id,
        'team_a_score', v_new_team_a_score,
        'team_b_score', v_new_team_b_score,
        'status', CASE WHEN v_match.status = 'finished' THEN 'in_progress' ELSE v_match.status END,
        'winner_team_id', NULL
    );
END;
$$;
