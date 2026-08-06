-- Sprint 14C: Operation Session Engine

-- ==========================================
-- 1. ensure_control_session
-- ==========================================
CREATE OR REPLACE FUNCTION public.ensure_control_session(
    p_tenant_id uuid,
    p_championship_id uuid,
    p_resource_id uuid,
    p_match_id uuid,
    p_existing_token_hash text,
    p_new_token_hash text
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_championship public.championships%ROWTYPE;
    v_table public.game_tables%ROWTYPE;
    v_match public.matches%ROWTYPE;
    v_active_session public.match_sessions%ROWTYPE;
BEGIN
    -- 1. Bloquear Championship
    SELECT * INTO v_championship
    FROM public.championships
    WHERE id = p_championship_id AND tenant_id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'championship_not_found_or_invalid_tenant';
    END IF;

    -- 2. Validar Resource e bloquear
    SELECT * INTO v_table
    FROM public.game_tables
    WHERE id = p_resource_id AND championship_id = p_championship_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'resource_not_found';
    END IF;

    IF v_table.current_match_id IS DISTINCT FROM p_match_id THEN
        RAISE EXCEPTION 'resource_match_mismatch';
    END IF;

    -- 3. Validar Match e bloquear
    SELECT * INTO v_match
    FROM public.matches
    WHERE id = p_match_id AND championship_id = p_championship_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'match_not_found';
    END IF;

    IF v_match.status NOT IN ('scheduled', 'in_progress') THEN
        RAISE EXCEPTION 'match_not_in_progress';
    END IF;

    -- 4. Buscar e Bloquear Sessão CONTROL ativa
    SELECT * INTO v_active_session
    FROM public.match_sessions
    WHERE match_id = p_match_id 
      AND role = 'CONTROL' 
      AND status = 'active'
      AND expires_at > NOW()
    FOR UPDATE;

    IF FOUND THEN
        -- Cenário A: Sessão ativa e hash existente corresponde
        IF p_existing_token_hash IS NOT NULL AND v_active_session.session_token_hash = p_existing_token_hash THEN
            RETURN jsonb_build_object('status', 'reused');
        END IF;

        -- Cenário C: Sessão ativa, mas hash ausente ou diferente
        RETURN jsonb_build_object('status', 'control_session_already_active');
    END IF;

    -- Cenário B: Nenhuma sessão ativa válida
    -- Expira qualquer sessão ativa fantasma/expirada logicamente mas não atualizada no status
    UPDATE public.match_sessions
    SET status = 'expired'
    WHERE match_id = p_match_id AND role = 'CONTROL' AND status = 'active';

    -- Insere nova sessão
    INSERT INTO public.match_sessions (
        match_id,
        table_id,
        role,
        session_token_hash,
        status,
        expires_at
    ) VALUES (
        p_match_id,
        p_resource_id,
        'CONTROL',
        p_new_token_hash,
        'active',
        NOW() + INTERVAL '12 hours'
    );

    RETURN jsonb_build_object('status', 'created');
END;
$$;

-- Revogar e conceder acessos (ensure_control_session)
REVOKE EXECUTE ON FUNCTION public.ensure_control_session(uuid, uuid, uuid, uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_control_session(uuid, uuid, uuid, uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.ensure_control_session(uuid, uuid, uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_control_session(uuid, uuid, uuid, uuid, text, text) TO service_role;


-- ==========================================
-- 2. take_over_control_session
-- ==========================================
CREATE OR REPLACE FUNCTION public.take_over_control_session(
    p_tenant_id uuid,
    p_championship_id uuid,
    p_resource_id uuid,
    p_match_id uuid,
    p_new_token_hash text
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_championship public.championships%ROWTYPE;
    v_table public.game_tables%ROWTYPE;
    v_match public.matches%ROWTYPE;
BEGIN
    -- 1. Bloquear Championship
    SELECT * INTO v_championship
    FROM public.championships
    WHERE id = p_championship_id AND tenant_id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'championship_not_found_or_invalid_tenant';
    END IF;

    -- 2. Validar Resource e bloquear
    SELECT * INTO v_table
    FROM public.game_tables
    WHERE id = p_resource_id AND championship_id = p_championship_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'resource_not_found';
    END IF;

    IF v_table.current_match_id IS DISTINCT FROM p_match_id THEN
        RAISE EXCEPTION 'resource_match_mismatch';
    END IF;

    -- 3. Validar Match e bloquear
    SELECT * INTO v_match
    FROM public.matches
    WHERE id = p_match_id AND championship_id = p_championship_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'match_not_found';
    END IF;

    IF v_match.status NOT IN ('scheduled', 'in_progress') THEN
        RAISE EXCEPTION 'match_not_in_progress';
    END IF;

    -- 4. Expirar Sessões Anteriores (bloqueia linhas afetadas)
    UPDATE public.match_sessions
    SET status = 'expired'
    WHERE match_id = p_match_id 
      AND role = 'CONTROL' 
      AND status = 'active';

    -- 5. Criar Nova Sessão de Takeover
    INSERT INTO public.match_sessions (
        match_id,
        table_id,
        role,
        session_token_hash,
        status,
        expires_at
    ) VALUES (
        p_match_id,
        p_resource_id,
        'CONTROL',
        p_new_token_hash,
        'active',
        NOW() + INTERVAL '12 hours'
    );

    RETURN jsonb_build_object('status', 'taken_over');
END;
$$;

-- Revogar e conceder acessos (take_over_control_session)
REVOKE EXECUTE ON FUNCTION public.take_over_control_session(uuid, uuid, uuid, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.take_over_control_session(uuid, uuid, uuid, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.take_over_control_session(uuid, uuid, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.take_over_control_session(uuid, uuid, uuid, uuid, text) TO service_role;
