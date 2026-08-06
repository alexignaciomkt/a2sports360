-- ==============================================================================
-- SPRINT 13A - RESOURCE INFRASTRUCTURE V2
-- ==============================================================================

-- 1. ADD COLUMNS (ALLOW NULL INITIALLY FOR BACKFILL)
ALTER TABLE public.game_tables
  ADD COLUMN IF NOT EXISTS tenant_id UUID,
  ADD COLUMN IF NOT EXISTS resource_type TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS display_order INTEGER,
  ADD COLUMN IF NOT EXISTS prefix_group TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- 2. BACKFILL TENANT_ID
UPDATE public.game_tables gt
SET tenant_id = c.tenant_id
FROM public.championships c
WHERE gt.championship_id = c.id
  AND gt.tenant_id IS NULL;

-- Fail if any game_table has no tenant_id (championship missing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.game_tables WHERE tenant_id IS NULL) THEN
    RAISE EXCEPTION 'Backfill failed: found game_tables without a corresponding championship';
  END IF;
END $$;

-- 3. BACKFILL METADATA
UPDATE public.game_tables
SET 
  resource_type = COALESCE(resource_type, 'TABLE'),
  display_name = COALESCE(display_name, 'Mesa ' || number),
  display_order = COALESCE(display_order, number),
  prefix_group = COALESCE(NULLIF(trim(prefix_group), ''), 'Mesa'),
  created_at = COALESCE(created_at, now()),
  updated_at = COALESCE(updated_at, created_at, now());

-- 4. VALIDATE NO NULLS BEFORE NOT NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.game_tables 
    WHERE tenant_id IS NULL 
       OR resource_type IS NULL 
       OR display_name IS NULL 
       OR display_order IS NULL 
       OR prefix_group IS NULL
       OR created_at IS NULL
       OR updated_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Validation failed: cannot apply NOT NULL constraints because NULL values still exist.';
  END IF;
END $$;

-- 5. APPLY CONSTRAINTS AND NOT NULL
ALTER TABLE public.game_tables
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN resource_type SET NOT NULL,
  ALTER COLUMN display_name SET NOT NULL,
  ALTER COLUMN display_order SET NOT NULL,
  ALTER COLUMN prefix_group SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

-- 6. APPLY DOMAIN CONSTRAINTS
-- Safe drop in case of partial execution
ALTER TABLE public.game_tables DROP CONSTRAINT IF EXISTS chk_resource_type;
ALTER TABLE public.game_tables
  ADD CONSTRAINT chk_resource_type CHECK (resource_type IN ('TABLE', 'COURT', 'FIELD', 'BOARD', 'ARENA', 'RING', 'MAT', 'TRACK', 'STATION', 'ROOM'));

-- The constraint UNIQUE(championship_id, number) already exists in init_schema.
-- Add new constraint for unique prefix_group and display_order
ALTER TABLE public.game_tables DROP CONSTRAINT IF EXISTS game_tables_champ_prefix_order_key;
ALTER TABLE public.game_tables
  ADD CONSTRAINT game_tables_champ_prefix_order_key UNIQUE (championship_id, prefix_group, display_order);

-- 7. MULTI-TENANT RLS UPDATE
-- Remove old permissive policy and add new strict multi-tenant policy
DROP POLICY IF EXISTS "organizer_tables_all" ON public.game_tables;

CREATE POLICY "organizer_tables_all" ON public.game_tables
FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Public policy remains exactly as it was:
-- CREATE POLICY "public_read_game_tables" ON public.game_tables FOR SELECT USING (true);

-- 8. RPC FOR BATCH CREATION
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
        encode(gen_random_bytes(16), 'hex'),
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

REVOKE EXECUTE ON FUNCTION public.configure_championship_resources FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.configure_championship_resources TO authenticated;
GRANT EXECUTE ON FUNCTION public.configure_championship_resources TO service_role;
