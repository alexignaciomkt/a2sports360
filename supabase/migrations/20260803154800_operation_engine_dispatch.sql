-- operation_engine_dispatch

-- Drop NOT NULL from matches.table_id so matches can exist without a table
ALTER TABLE matches ALTER COLUMN table_id DROP NOT NULL;

-- Create atomic dispatch function
CREATE OR REPLACE FUNCTION dispatch_match_to_table(
    p_tenant_id UUID,
    p_championship_id UUID,
    p_match_id UUID,
    p_table_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_match matches%ROWTYPE;
    v_table game_tables%ROWTYPE;
    v_championship championships%ROWTYPE;
BEGIN
    -- Validate championship and tenant
    SELECT * INTO v_championship
    FROM championships
    WHERE id = p_championship_id AND tenant_id = p_tenant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'invalid_tenant_or_championship';
    END IF;

    -- Block Table and Match FOR UPDATE
    SELECT * INTO v_table
    FROM game_tables
    WHERE id = p_table_id AND championship_id = p_championship_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'table_not_found';
    END IF;

    SELECT * INTO v_match
    FROM matches
    WHERE id = p_match_id AND championship_id = p_championship_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'match_not_found';
    END IF;

    -- Idempotency check: if already dispatched correctly
    IF v_table.current_match_id = p_match_id AND v_match.table_id = p_table_id AND v_match.status = 'in_progress' AND v_table.status = 'occupied' THEN
        RETURN jsonb_build_object(
            'success', true,
            'match_id', p_match_id,
            'table_id', p_table_id,
            'status', 'in_progress'
        );
    END IF;

    -- Validations
    IF v_table.status != 'available' THEN
        RAISE EXCEPTION 'table_not_available';
    END IF;

    IF v_table.current_match_id IS NOT NULL THEN
        RAISE EXCEPTION 'table_already_occupied';
    END IF;

    IF v_match.status != 'scheduled' THEN
        RAISE EXCEPTION 'match_not_scheduled';
    END IF;

    IF v_match.table_id IS NOT NULL AND v_match.table_id != p_table_id THEN
        RAISE EXCEPTION 'match_assigned_to_another_table';
    END IF;

    -- Update match
    UPDATE matches
    SET table_id = p_table_id,
        status = 'in_progress',
        started_at = NOW(),
        updated_at = NOW()
    WHERE id = p_match_id;

    -- Update table
    UPDATE game_tables
    SET status = 'occupied',
        current_match_id = p_match_id
    WHERE id = p_table_id;

    RETURN jsonb_build_object(
        'success', true,
        'match_id', p_match_id,
        'table_id', p_table_id,
        'status', 'in_progress'
    );
END;
$$;
