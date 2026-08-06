-- ==============================================================================
-- BUGFIX: OVERLOAD DE register_match_event
-- ==============================================================================
-- A criação de múltiplas assinaturas causou erro de ambiguidade no PostgREST.
-- Esta migration limpa TODAS as variações e recria a função com uma única
-- assinatura canônica.
-- ==============================================================================

-- 1. DROP de todas as assinaturas conhecidas para garantir que não há overloads
DROP FUNCTION IF EXISTS public.register_match_event(
  TEXT, TEXT, UUID, JSONB, INT, TEXT, UUID
);

DROP FUNCTION IF EXISTS public.register_match_event(
  UUID, TEXT, TEXT, UUID, INT, TEXT, JSONB
);

-- 2. Recriar a função com a assinatura canônica (ordem alfabética, conforme Actions)
--    Preservando toda a lógica mais recente da Sprint 10 (Encounters) + Sprint 14 (updated_at)
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

-- 3. Aplicar grants conforme a política
REVOKE EXECUTE ON FUNCTION public.register_match_event(TEXT, TEXT, UUID, JSONB, INT, TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.register_match_event(TEXT, TEXT, UUID, JSONB, INT, TEXT, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.register_match_event(TEXT, TEXT, UUID, JSONB, INT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_match_event(TEXT, TEXT, UUID, JSONB, INT, TEXT, UUID) TO service_role;
