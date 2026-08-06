-- ==============================================================================
-- SPRINT 14 — OPERATION ENGINE V2 (Orquestração Operacional)
-- ==============================================================================
-- Política de locks: championship primeiro (FOR UPDATE).
-- Serializa todas as Commands operacionais do mesmo campeonato.
-- Commands de campeonatos diferentes podem executar em paralelo.
-- ==============================================================================

-- ==============================================================================
-- PARTE 1: CORREÇÃO DE BUG LATENTE — matches.updated_at
-- ==============================================================================
-- As RPCs dispatch_encounter_to_resource, resolve_finished_game e
-- register_match_event referenciam matches.updated_at, que nunca foi criada.
-- Adicioná-la agora corrige o bug e alinha matches com encounters/championships.
-- Nullable (DEFAULT now()), seguindo o padrão de encounters e championships.

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE public.matches
SET updated_at = COALESCE(finished_at, started_at, now())
WHERE updated_at IS NULL;

-- ==============================================================================
-- PARTE 2: CORREÇÃO DE LOCK ORDER — dispatch_encounter_to_resource
-- ==============================================================================
-- Versão anterior travava game_table antes de encounter.
-- Nova ordem: championship → encounter → match → resource.
-- Alinhada com resolve_finished_game e process_dispatch_queue.

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
    v_championship public.championships%ROWTYPE;
    v_encounter public.encounters%ROWTYPE;
    v_table public.game_tables%ROWTYPE;
    v_first_match public.matches%ROWTYPE;
    v_ip_count INT;
    v_now TIMESTAMPTZ := now();
BEGIN
    -- 1. Lock championship
    SELECT * INTO v_championship FROM public.championships
    WHERE id = p_championship_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'championship_not_found';
    END IF;
    IF v_championship.tenant_id != p_tenant_id THEN
        RAISE EXCEPTION 'championship_not_found';
    END IF;

    -- 2. Lock encounter
    SELECT * INTO v_encounter FROM public.encounters
    WHERE id = p_encounter_id
      AND championship_id = p_championship_id
      AND tenant_id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'encounter_not_found';
    END IF;

    -- 3. Tentar lock da Queda 1 scheduled
    SELECT * INTO v_first_match FROM public.matches
    WHERE encounter_id = p_encounter_id
      AND game_number = 1
      AND status = 'scheduled'
      AND table_id IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        -- === CAMINHO IDEMPOTENTE ===
        SELECT * INTO v_table FROM public.game_tables
        WHERE id = p_resource_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'INCONSISTENT_OPERATIONAL_STATE';
        END IF;

        IF v_table.current_encounter_id IS DISTINCT FROM p_encounter_id
           OR v_table.status <> 'occupied'
           OR v_encounter.status <> 'in_progress' THEN
            RAISE EXCEPTION 'INCONSISTENT_OPERATIONAL_STATE';
        END IF;

        -- Buscar a Queda in_progress com lock
        SELECT * INTO v_first_match FROM public.matches
        WHERE encounter_id = p_encounter_id
          AND status = 'in_progress'
          AND table_id = p_resource_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'INCONSISTENT_OPERATIONAL_STATE';
        END IF;

        IF v_table.current_match_id IS DISTINCT FROM v_first_match.id THEN
            RAISE EXCEPTION 'INCONSISTENT_OPERATIONAL_STATE';
        END IF;

        -- Garantir exatamente uma Queda in_progress
        SELECT COUNT(*) INTO v_ip_count FROM public.matches
        WHERE encounter_id = p_encounter_id
          AND status = 'in_progress';

        IF v_ip_count > 1 THEN
            RAISE EXCEPTION 'INCONSISTENT_OPERATIONAL_STATE';
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'idempotent', true,
            'encounter_id', p_encounter_id,
            'active_game_id', v_first_match.id,
            'resource_id', p_resource_id
        );
    END IF;

    -- 4. Lock resource
    SELECT * INTO v_table FROM public.game_tables
    WHERE id = p_resource_id
      AND championship_id = p_championship_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'resource_not_found';
    END IF;

    -- Validações de integridade
    IF v_table.status <> 'available'
       OR v_table.current_encounter_id IS NOT NULL
       OR v_table.current_match_id IS NOT NULL THEN
        RAISE EXCEPTION 'INCONSISTENT_OPERATIONAL_STATE';
    END IF;

    IF v_encounter.status <> 'scheduled' THEN
        RAISE EXCEPTION 'INCONSISTENT_OPERATIONAL_STATE';
    END IF;

    IF v_first_match.team_a_id <> v_encounter.team_a_id
       OR v_first_match.team_b_id <> v_encounter.team_b_id THEN
        RAISE EXCEPTION 'INCONSISTENT_OPERATIONAL_STATE';
    END IF;

    -- === DESPACHO ATÔMICO ===
    UPDATE public.encounters
    SET status = 'in_progress', started_at = v_now, updated_at = v_now
    WHERE id = p_encounter_id
      AND status = 'scheduled';
    IF NOT FOUND THEN RAISE EXCEPTION 'INCONSISTENT_OPERATIONAL_STATE'; END IF;

    UPDATE public.matches
    SET status = 'in_progress', started_at = v_now, table_id = p_resource_id,
        updated_at = v_now
    WHERE id = v_first_match.id
      AND status = 'scheduled'
      AND table_id IS NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'INCONSISTENT_OPERATIONAL_STATE'; END IF;

    UPDATE public.game_tables
    SET status = 'occupied',
        current_encounter_id = p_encounter_id,
        current_match_id = v_first_match.id
    WHERE id = p_resource_id
      AND status = 'available'
      AND current_encounter_id IS NULL
      AND current_match_id IS NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'INCONSISTENT_OPERATIONAL_STATE'; END IF;

    RETURN jsonb_build_object(
        'success', true,
        'idempotent', false,
        'encounter_id', p_encounter_id,
        'active_game_id', v_first_match.id,
        'resource_id', p_resource_id
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.dispatch_encounter_to_resource(UUID, UUID, UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.dispatch_encounter_to_resource(UUID, UUID, UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.dispatch_encounter_to_resource(UUID, UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_encounter_to_resource(UUID, UUID, UUID, UUID) TO service_role;


-- ==============================================================================
-- PARTE 3: NOVA RPC — process_dispatch_queue
-- ==============================================================================
-- Despacho determinístico em lote.
-- Lock global: championship FOR UPDATE (serializa a fila).
-- Loop orientado por Resources (display_order ASC, id ASC).
-- Encounters elegíveis por Resource (created_at ASC, id ASC).
-- Subtransação por pareamento (BEGIN...EXCEPTION...END).
-- Exceções capturadas: NO_DATA_FOUND e raise_exception.
-- WHEN OTHERS proibido pela Constituição da Plataforma.

CREATE OR REPLACE FUNCTION public.process_dispatch_queue(
    p_tenant_id UUID,
    p_championship_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_championship public.championships%ROWTYPE;
    v_resource RECORD;
    v_encounter RECORD;
    v_match public.matches%ROWTYPE;
    v_dispatched JSONB := '[]'::JSONB;
    v_skipped JSONB := '[]'::JSONB;
    v_dispatched_count INT := 0;
    v_skipped_count INT := 0;
    v_waiting_count INT := 0;
    v_available_remaining INT := 0;
    v_now TIMESTAMPTZ := now();
    v_used_encounter_ids UUID[] := '{}';
    v_found_pair BOOLEAN;
    v_skip_reason TEXT;
BEGIN
    -- 1. Lock championship (serializa toda a fila deste campeonato)
    SELECT * INTO v_championship
    FROM public.championships
    WHERE id = p_championship_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'championship_not_found';
    END IF;
    IF v_championship.tenant_id != p_tenant_id THEN
        RAISE EXCEPTION 'championship_not_found';
    END IF;

    -- 2. Loop orientado por Resources disponíveis
    FOR v_resource IN
        SELECT *
        FROM public.game_tables
        WHERE championship_id = p_championship_id
          AND tenant_id = p_tenant_id
          AND status = 'available'
          AND current_encounter_id IS NULL
          AND current_match_id IS NULL
        ORDER BY display_order ASC, id ASC
        FOR UPDATE
    LOOP
        v_found_pair := FALSE;

        <<encounter_search>>
        FOR v_encounter IN
            SELECT *
            FROM public.encounters
            WHERE championship_id = p_championship_id
              AND tenant_id = p_tenant_id
              AND status = 'scheduled'
              AND id != ALL(v_used_encounter_ids)
            ORDER BY created_at ASC, id ASC
            FOR UPDATE
        LOOP
            v_used_encounter_ids := v_used_encounter_ids || v_encounter.id;
            v_skip_reason := NULL;

            -- === SUBTRANSAÇÃO: isolamento por pareamento ===
            BEGIN
                -- Buscar Queda 1 válida (STRICT = falha se não encontrar)
                SELECT * INTO STRICT v_match
                FROM public.matches
                WHERE encounter_id = v_encounter.id
                  AND game_number = 1
                  AND status = 'scheduled'
                  AND table_id IS NULL
                FOR UPDATE;

                -- Validar equipes
                IF v_match.team_a_id != v_encounter.team_a_id
                   OR v_match.team_b_id != v_encounter.team_b_id THEN
                    RAISE EXCEPTION 'inconsistent_teams';
                END IF;

                -- Encounter → in_progress
                UPDATE public.encounters
                SET status = 'in_progress',
                    started_at = v_now,
                    updated_at = v_now
                WHERE id = v_encounter.id
                  AND status = 'scheduled';
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'encounter_state_changed';
                END IF;

                -- Match (Queda 1) → in_progress
                UPDATE public.matches
                SET status = 'in_progress',
                    started_at = v_now,
                    table_id = v_resource.id,
                    updated_at = v_now
                WHERE id = v_match.id
                  AND status = 'scheduled'
                  AND table_id IS NULL
                  AND game_number = 1
                  AND encounter_id = v_encounter.id;
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'game_state_changed';
                END IF;

                -- Resource → occupied
                UPDATE public.game_tables
                SET status = 'occupied',
                    current_encounter_id = v_encounter.id,
                    current_match_id = v_match.id
                WHERE id = v_resource.id
                  AND status = 'available'
                  AND current_encounter_id IS NULL
                  AND current_match_id IS NULL;
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'resource_state_changed';
                END IF;

            EXCEPTION
                WHEN NO_DATA_FOUND THEN
                    v_skip_reason := 'missing_initial_game';
                WHEN raise_exception THEN
                    v_skip_reason := SQLERRM;
            END;
            -- === FIM SUBTRANSAÇÃO ===

            IF v_skip_reason IS NOT NULL THEN
                v_skipped := v_skipped || jsonb_build_object(
                    'encounter_id', v_encounter.id,
                    'reason', v_skip_reason
                );
                v_skipped_count := v_skipped_count + 1;

                -- Resource inválido: não tentar mais encounters neste resource
                IF v_skip_reason = 'resource_state_changed' THEN
                    EXIT encounter_search;
                END IF;
            ELSE
                -- Sucesso: acumular resultado
                v_dispatched := v_dispatched || jsonb_build_object(
                    'encounter_id', v_encounter.id,
                    'resource_id', v_resource.id,
                    'resource_name', v_resource.display_name,
                    'active_game_id', v_match.id
                );
                v_dispatched_count := v_dispatched_count + 1;
                v_found_pair := TRUE;
                EXIT encounter_search;
            END IF;

        END LOOP; -- encounter_search
    END LOOP; -- resources

    -- 3. Contar encounters que continuam scheduled
    SELECT COUNT(*) INTO v_waiting_count
    FROM public.encounters
    WHERE championship_id = p_championship_id
      AND tenant_id = p_tenant_id
      AND status = 'scheduled';

    -- 4. Contar resources que continuam available
    SELECT COUNT(*) INTO v_available_remaining
    FROM public.game_tables
    WHERE championship_id = p_championship_id
      AND tenant_id = p_tenant_id
      AND status = 'available'
      AND current_encounter_id IS NULL
      AND current_match_id IS NULL;

    RETURN jsonb_build_object(
        'success', true,
        'dispatched_count', v_dispatched_count,
        'waiting_count', v_waiting_count,
        'skipped_count', v_skipped_count,
        'available_resources_remaining', v_available_remaining,
        'dispatches', v_dispatched,
        'skipped', v_skipped
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_dispatch_queue(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_dispatch_queue(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.process_dispatch_queue(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_dispatch_queue(UUID, UUID) TO service_role;
