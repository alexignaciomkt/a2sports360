-- ==============================================================================
-- BUGFIX SPRINT 13A - QR TOKEN GENERATION
-- ==============================================================================
-- O ambiente Supabase não tem gen_random_bytes() habilitado publicamente por
-- padrão sem carregar a extensão pgcrypto. Como o projeto originalmente gerava 
-- UUIDs em TypeScript via randomBytes(16).toString("hex"), para não injetar
-- extensões novas desnecessariamente, a geração de QR Token usará um UUID v4
-- puro sem hífens, garantindo entropia segura nativamente pelo PostgreSQL.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.configure_championship_resources(
  p_tenant_id UUID,
  p_championship_id UUID,
  p_resource_type TEXT,
  p_prefix TEXT,
  p_quantity INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing_count INTEGER;
  v_normalized_prefix TEXT;
  v_i INTEGER;
  v_next_number INTEGER;
  v_created_count INTEGER := 0;
  v_total_after INTEGER;
  v_resources JSONB;
BEGIN
  -- 1. Validate championship belongs to tenant
  IF NOT EXISTS (SELECT 1 FROM public.championships WHERE id = p_championship_id AND tenant_id = p_tenant_id) THEN
    RAISE EXCEPTION 'Championship not found or does not belong to tenant.';
  END IF;

  -- 2. Validate championship_settings existing
  IF NOT EXISTS (SELECT 1 FROM public.championship_settings WHERE championship_id = p_championship_id) THEN
    RAISE EXCEPTION 'Esport configuration not found. Cannot configure arenas without sport settings.';
  END IF;

  -- 3. Validate quantity
  IF p_quantity < 1 OR p_quantity > 1000 THEN
    RAISE EXCEPTION 'Quantity must be between 1 and 1000.';
  END IF;

  -- 4. Validate prefix
  v_normalized_prefix := TRIM(p_prefix);
  IF v_normalized_prefix = '' OR v_normalized_prefix IS NULL THEN
    RAISE EXCEPTION 'Prefix cannot be empty.';
  END IF;

  -- Lock championship to prevent concurrent arena setup
  PERFORM 1 FROM public.championships WHERE id = p_championship_id FOR UPDATE;

  -- Check existing count for this prefix group
  SELECT COUNT(*) INTO v_existing_count
  FROM public.game_tables
  WHERE championship_id = p_championship_id
    AND resource_type = p_resource_type
    AND prefix_group = v_normalized_prefix;

  IF p_quantity < v_existing_count THEN
    RETURN jsonb_build_object(
      'success', true,
      'created_count', 0,
      'existing_count', v_existing_count,
      'requested_quantity', p_quantity,
      'total_count', v_existing_count,
      'reduction_requested', true,
      'message', 'A redução exige uma ação administrativa segura. Nenhum recurso foi apagado.'
    );
  END IF;

  -- Create missing resources to fulfill 1 to p_quantity display_orders
  FOR v_i IN 1..p_quantity LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.game_tables 
      WHERE championship_id = p_championship_id 
        AND resource_type = p_resource_type 
        AND prefix_group = v_normalized_prefix 
        AND display_order = v_i
    ) THEN
      -- Get next global number
      SELECT COALESCE(MAX(number), 0) + 1 INTO v_next_number
      FROM public.game_tables
      WHERE championship_id = p_championship_id;

      INSERT INTO public.game_tables (
        tenant_id,
        championship_id,
        number,
        qr_token,
        status,
        resource_type,
        display_name,
        display_order,
        prefix_group,
        created_at,
        updated_at
      ) VALUES (
        p_tenant_id,
        p_championship_id,
        v_next_number,
        REPLACE(gen_random_uuid()::text, '-', ''),
        'available',
        p_resource_type,
        v_normalized_prefix || ' ' || v_i,
        v_i,
        v_normalized_prefix,
        now(),
        now()
      );
      v_created_count := v_created_count + 1;
    END IF;
  END LOOP;

  -- Fetch total after creation
  SELECT COUNT(*) INTO v_total_after
  FROM public.game_tables
  WHERE championship_id = p_championship_id
    AND resource_type = p_resource_type
    AND prefix_group = v_normalized_prefix;

  SELECT jsonb_agg(row_to_json(gt)) INTO v_resources
  FROM public.game_tables gt
  WHERE championship_id = p_championship_id
    AND resource_type = p_resource_type
    AND prefix_group = v_normalized_prefix;

  RETURN jsonb_build_object(
    'success', true,
    'created_count', v_created_count,
    'existing_count', v_existing_count,
    'requested_quantity', p_quantity,
    'total_count', v_total_after,
    'reduction_requested', false,
    'resources', COALESCE(v_resources, '[]'::jsonb)
  );
END;
$$;
