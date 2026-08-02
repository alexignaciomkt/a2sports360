-- Migration: A2Tickets Integration (Sprint 04 - Consolidated)

-- 1. Create tenant_mappings table
CREATE TABLE IF NOT EXISTS public.tenant_mappings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    source_system text NOT NULL,
    external_tenant_id text NOT NULL,
    metadata jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT tenant_mappings_source_system_external_tenant_id_key UNIQUE (source_system, external_tenant_id),
    CONSTRAINT tenant_mappings_tenant_id_source_system_key UNIQUE (tenant_id, source_system)
);

-- Enable RLS (No public policies will be created, meaning access is restricted by default)
ALTER TABLE public.tenant_mappings ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenant_mappings_tenant_id ON public.tenant_mappings(tenant_id);

-- 2. Add columns to championships if they don't exist
ALTER TABLE public.championships 
    ADD COLUMN IF NOT EXISTS metadata jsonb,
    ADD COLUMN IF NOT EXISTS starts_at timestamptz;
