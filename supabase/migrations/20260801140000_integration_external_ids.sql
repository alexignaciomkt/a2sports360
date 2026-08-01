-- Migration to add external IDs and unique constraints for Integration API

-- 1. Modificar public.tenants
ALTER TABLE public.tenants 
ADD COLUMN external_source TEXT,
ADD COLUMN external_id TEXT;

-- Garantir que a combinação (external_source, external_id) seja única
ALTER TABLE public.tenants
ADD CONSTRAINT tenants_external_source_external_id_key UNIQUE (external_source, external_id);


-- 2. Modificar public.championships
ALTER TABLE public.championships
ADD COLUMN source_system TEXT;

-- A coluna external_event_id já existe. Vamos adicionar a unicidade composta.
ALTER TABLE public.championships
ADD CONSTRAINT championships_source_system_external_event_id_key UNIQUE (source_system, external_event_id);
