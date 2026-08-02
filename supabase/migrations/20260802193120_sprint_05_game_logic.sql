-- sprint_05_game_logic

-- Re-criar a função register_match_event com lógica completa e segura
CREATE OR REPLACE FUNCTION register_match_event(
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
AS $$
DECLARE
    v_match matches%ROWTYPE;
    v_session match_sessions%ROWTYPE;
    v_championship championships%ROWTYPE;
    v_new_sequence INT;
    v_new_team_a_score INT;
    v_new_team_b_score INT;
    v_winner_team_id UUID := NULL;
    v_is_team_a BOOLEAN;
BEGIN
    -- 1. Validar a sessão CONTROL
    SELECT * INTO v_session
    FROM match_sessions
    WHERE match_id = p_match_id
      AND session_token_hash = p_session_token_hash
      AND role = 'CONTROL'
      AND status = 'active'
      AND expires_at > NOW();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'invalid_or_expired_session';
    END IF;

    -- 2 e 3. Bloquear a linha da partida com FOR UPDATE para evitar race conditions
    SELECT * INTO v_match
    FROM matches
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
    FROM match_events
    WHERE match_id = p_match_id;

    -- 8. Inserir match_event
    INSERT INTO match_events (
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

    -- 11. Verificar target_score
    SELECT * INTO v_championship
    FROM championships
    WHERE id = v_match.championship_id;

    -- 12. Finalizar a partida se uma dupla atingir ou ultrapassar o target_score (geralmente 12)
    IF v_new_team_a_score >= v_championship.target_score THEN
        v_winner_team_id := v_match.team_a_id;
    ELSIF v_new_team_b_score >= v_championship.target_score THEN
        v_winner_team_id := v_match.team_b_id;
    END IF;

    IF v_winner_team_id IS NOT NULL THEN
        -- 13 e 14. Preencher winner e finalizar partida
        UPDATE matches
        SET team_a_score = v_new_team_a_score,
            team_b_score = v_new_team_b_score,
            status = 'finished',
            winner_team_id = v_winner_team_id,
            finished_at = NOW(),
            updated_at = NOW()
        WHERE id = p_match_id;

        -- 15. Liberar a Mesa 1
        UPDATE game_tables
        SET status = 'available',
            current_match_id = NULL
        WHERE id = v_match.table_id;

        -- 16. Invalidar a sessão de controle
        UPDATE match_sessions
        SET status = 'expired'
        WHERE match_id = p_match_id AND role = 'CONTROL';
    ELSE
        -- Apenas atualiza placar
        UPDATE matches
        SET team_a_score = v_new_team_a_score,
            team_b_score = v_new_team_b_score,
            updated_at = NOW()
        WHERE id = p_match_id;
    END IF;

    -- 17. Retornar um JSON sanitizado
    RETURN jsonb_build_object(
        'match_id', p_match_id,
        'team_a_score', v_new_team_a_score,
        'team_b_score', v_new_team_b_score,
        'status', CASE WHEN v_winner_team_id IS NOT NULL THEN 'finished' ELSE 'in_progress' END,
        'winner_team_id', v_winner_team_id
    );
END;
$$;


-- Nova função RPC para Desfazer Último Evento
CREATE OR REPLACE FUNCTION undo_match_event(
    p_match_id UUID,
    p_session_token_hash TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_match matches%ROWTYPE;
    v_session match_sessions%ROWTYPE;
    v_last_event match_events%ROWTYPE;
    v_new_team_a_score INT;
    v_new_team_b_score INT;
    v_is_team_a BOOLEAN;
BEGIN
    -- 1. Validar a sessão CONTROL
    SELECT * INTO v_session
    FROM match_sessions
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
    FROM matches
    WHERE id = p_match_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'match_not_found';
    END IF;

    -- 3. Localizar o último match_event válido (ignorar eventos do tipo UNDO, apenas o original)
    SELECT * INTO v_last_event
    FROM match_events
    WHERE match_id = p_match_id
      AND event_type != 'undo'
      AND id NOT IN (
          SELECT (metadata->>'undone_event_id')::UUID 
          FROM match_events 
          WHERE match_id = p_match_id AND event_type = 'undo'
      )
    ORDER BY sequence DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'no_events_to_undo';
    END IF;
    
    -- 5. Validar se o team_id do último evento é o team A ou B
    IF v_last_event.team_id = v_match.team_a_id THEN
        v_is_team_a := true;
    ELSIF v_last_event.team_id = v_match.team_b_id THEN
        v_is_team_a := false;
    ELSE
        RAISE EXCEPTION 'team_not_in_match';
    END IF;

    -- 6. Recalcular placar
    v_new_team_a_score := v_match.team_a_score;
    v_new_team_b_score := v_match.team_b_score;

    IF v_is_team_a THEN
        v_new_team_a_score := GREATEST(0, v_new_team_a_score - v_last_event.points_delta);
    ELSE
        v_new_team_b_score := GREATEST(0, v_new_team_b_score - v_last_event.points_delta);
    END IF;

    -- 7. Inserir evento compensatório UNDO
    INSERT INTO match_events (
        match_id, event_type, team_id, points_delta, sequence, device_id, metadata
    ) VALUES (
        p_match_id, 'undo', v_last_event.team_id, -v_last_event.points_delta, v_last_event.sequence + 1, v_last_event.device_id, jsonb_build_object('undone_event_id', v_last_event.id)
    );

    -- 8. Atualizar a partida. Se estava finalizada, reabre
    IF v_match.status = 'finished' THEN
        UPDATE matches
        SET team_a_score = v_new_team_a_score,
            team_b_score = v_new_team_b_score,
            status = 'in_progress',
            winner_team_id = NULL,
            finished_at = NULL,
            updated_at = NOW()
        WHERE id = p_match_id;

        UPDATE game_tables
        SET status = 'occupied',
            current_match_id = p_match_id
        WHERE id = v_match.table_id;
        
        -- Reativar a sessão de controle se tinha sido expirada
        UPDATE match_sessions
        SET status = 'active'
        WHERE match_id = p_match_id AND role = 'CONTROL' AND session_token_hash = p_session_token_hash;
    ELSE
        UPDATE matches
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
