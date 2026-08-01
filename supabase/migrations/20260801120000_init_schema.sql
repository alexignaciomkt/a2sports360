-- Criação de Schemas e Extensões
CREATE SCHEMA IF NOT EXISTS public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Tabelas Base (Tenants e Profiles)
-- ==========================================
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. Entidades Principais do Domínio
-- ==========================================
CREATE TABLE public.championships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
    name TEXT NOT NULL,
    modality TEXT NOT NULL DEFAULT 'truco_duplas',
    format TEXT NOT NULL,
    target_score INT NOT NULL DEFAULT 12,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    external_event_id TEXT,
    public_screen_token_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    championship_id UUID REFERENCES public.championships(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT
);

CREATE TABLE public.team_players (
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    position INT NOT NULL CHECK (position IN (1, 2)),
    PRIMARY KEY (team_id, player_id),
    UNIQUE (team_id, position)
);

CREATE TABLE public.game_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    championship_id UUID REFERENCES public.championships(id) ON DELETE CASCADE NOT NULL,
    number INT NOT NULL,
    qr_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    current_match_id UUID, -- FK adicionada via ALTER TABLE abaixo
    UNIQUE (championship_id, number)
);

CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    championship_id UUID REFERENCES public.championships(id) ON DELETE CASCADE NOT NULL,
    table_id UUID REFERENCES public.game_tables(id) NOT NULL,
    team_a_id UUID REFERENCES public.teams(id) NOT NULL,
    team_b_id UUID REFERENCES public.teams(id) NOT NULL,
    team_a_score INT NOT NULL DEFAULT 0 CHECK (team_a_score >= 0),
    team_b_score INT NOT NULL DEFAULT 0 CHECK (team_b_score >= 0),
    winner_team_id UUID REFERENCES public.teams(id),
    status TEXT NOT NULL DEFAULT 'PENDING',
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    CHECK (team_a_id != team_b_id),
    CHECK (winner_team_id IS NULL OR winner_team_id = team_a_id OR winner_team_id = team_b_id)
);

-- Resolver referência circular
ALTER TABLE public.game_tables 
  ADD CONSTRAINT fk_current_match FOREIGN KEY (current_match_id) REFERENCES public.matches(id) ON DELETE SET NULL;

-- ==========================================
-- 3. Eventos e Sessões
-- ==========================================
CREATE TABLE public.match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    sequence INT NOT NULL,
    event_type TEXT NOT NULL,
    team_id UUID REFERENCES public.teams(id),
    points_delta INT NOT NULL CHECK (points_delta IN (0, 1, 3, 6, 9, 12)),
    actor_id UUID,
    device_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (match_id, sequence)
);

CREATE INDEX idx_match_events_match_sequence ON public.match_events(match_id, sequence);

CREATE TABLE public.match_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    table_id UUID REFERENCES public.game_tables(id) ON DELETE CASCADE NOT NULL,
    session_token_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'CONTROL',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_match_sessions_token ON public.match_sessions(session_token_hash);
CREATE UNIQUE INDEX idx_unique_active_control_session ON public.match_sessions(match_id) WHERE role = 'CONTROL' AND status = 'ACTIVE';

-- ==========================================
-- 4. RLS - Row Level Security
-- ==========================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_sessions ENABLE ROW LEVEL SECURITY;

-- Organizador: Acesso total aos seus próprios dados
CREATE POLICY "organizer_tenant_select" ON public.tenants FOR SELECT USING (id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "organizer_profile_all" ON public.profiles FOR ALL USING (id = auth.uid());
CREATE POLICY "organizer_championships_all" ON public.championships FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "organizer_teams_all" ON public.teams FOR ALL USING (championship_id IN (SELECT id FROM public.championships WHERE tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "organizer_tables_all" ON public.game_tables FOR ALL USING (championship_id IN (SELECT id FROM public.championships WHERE tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "organizer_matches_all" ON public.matches FOR ALL USING (championship_id IN (SELECT id FROM public.championships WHERE tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())));

-- Anon/Public: Leitura restrita (exclusiva para as rotas publicas consumidas via handlers sanitizados ou Realtime)
CREATE POLICY "public_read_match_events" ON public.match_events FOR SELECT USING (true);
CREATE POLICY "public_read_game_tables" ON public.game_tables FOR SELECT USING (true);
CREATE POLICY "public_read_matches" ON public.matches FOR SELECT USING (true);
-- Nota: Inserções na mesa serão feitas APENAS via Route Handlers backend utilizando service_role, logo, não precisamos de POLICY pública de mutação.

-- ==========================================
-- 5. Realtime Setup
-- ==========================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_events;

-- ==========================================
-- 6. RPC: Assinatura da Função de Placar Atômico
-- ==========================================
-- Esta função será completamente implementada na Fatia 4. 
-- Ela serve para garantir atomicidade, prevenindo race conditions ao inserir pontos simultâneos.
CREATE OR REPLACE FUNCTION register_match_event(
    p_match_id UUID,
    p_session_token_hash TEXT,
    p_event_type TEXT,
    p_team_id UUID,
    p_points_delta INT,
    p_device_id TEXT,
    p_metadata JSONB
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_match_status TEXT;
    v_session_valid BOOLEAN;
    v_current_sequence INT;
    v_team_a_score INT;
    v_team_b_score INT;
BEGIN
    -- 1. Validar match_session (verificar hash, match_id, status = 'ACTIVE', expires_at > now())
    -- 2. Lock row da match for update (SERIALIZABLE behavior no contexto da partida)
    -- SELECT status, team_a_score, team_b_score INTO ... FROM matches WHERE id = p_match_id FOR UPDATE;
    -- 3. Calcular a proxima sequence: SELECT COALESCE(MAX(sequence), 0) + 1 FROM match_events WHERE match_id = p_match_id;
    -- 4. Inserir match_event
    -- 5. Atualizar score na tabela matches
    -- 6. Verificar se atingiu target_score (ex: 12). Se sim, status = 'FINISHED'
    -- 7. Retornar estado novo
    
    RETURN jsonb_build_object('success', false, 'message', 'Not implemented yet - Fatia 4');
END;
$$;
