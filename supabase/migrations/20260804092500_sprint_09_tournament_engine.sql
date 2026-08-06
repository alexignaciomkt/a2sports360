-- Migration: Sprint 09 - Tournament Engine V1
-- Description: Creates tournament_stages and encounters, updates matches, and provides generate_direct_match_tournament RPC.

-- 1. Create tournament_stages
CREATE TABLE public.tournament_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    championship_id UUID NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT tournament_stages_status_check CHECK (status IN ('scheduled', 'in_progress', 'finished')),
    CONSTRAINT tournament_stages_championship_type_unique UNIQUE (championship_id, type)
);

ALTER TABLE public.tournament_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizer_tournament_stages_all" 
    ON public.tournament_stages FOR ALL 
    USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 2. Create encounters
CREATE TABLE public.encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id UUID NOT NULL REFERENCES public.tournament_stages(id) ON DELETE CASCADE,
    championship_id UUID NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    team_a_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    team_b_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    best_of INTEGER NOT NULL,
    wins_required INTEGER NOT NULL,
    team_a_wins INTEGER NOT NULL DEFAULT 0,
    team_b_wins INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'scheduled',
    winner_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT encounters_teams_diff_check CHECK (team_a_id <> team_b_id),
    CONSTRAINT encounters_best_of_check CHECK (best_of >= 1),
    CONSTRAINT encounters_wins_required_check CHECK (wins_required >= 1),
    CONSTRAINT encounters_team_a_wins_check CHECK (team_a_wins >= 0),
    CONSTRAINT encounters_team_b_wins_check CHECK (team_b_wins >= 0),
    CONSTRAINT encounters_status_check CHECK (status IN ('scheduled', 'in_progress', 'finished')),
    CONSTRAINT encounters_winner_check CHECK (winner_team_id IS NULL OR winner_team_id = team_a_id OR winner_team_id = team_b_id)
);

ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizer_encounters_all" 
    ON public.encounters FOR ALL 
    USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 3. Modify matches (Game/Queda)
ALTER TABLE public.matches
    ADD COLUMN encounter_id UUID REFERENCES public.encounters(id) ON DELETE CASCADE,
    ADD COLUMN game_number INTEGER,
    ADD CONSTRAINT matches_game_number_check CHECK (encounter_id IS NULL OR game_number >= 1),
    ADD CONSTRAINT matches_encounter_game_pair_check CHECK ((encounter_id IS NULL AND game_number IS NULL) OR (encounter_id IS NOT NULL AND game_number IS NOT NULL)),
    ADD CONSTRAINT matches_encounter_game_unique UNIQUE (encounter_id, game_number);

-- 4. RPC for Tournament Generation (Atomic, Idempotent)
CREATE OR REPLACE FUNCTION public.generate_direct_match_tournament(
    p_championship_id UUID,
    p_tenant_id UUID
) RETURNS JSON AS $$
DECLARE
    v_config public.championship_settings%ROWTYPE;
    v_team_a_id UUID;
    v_team_b_id UUID;
    v_team_count INTEGER;
    v_wins_required INTEGER;
    v_stage_id UUID;
    v_encounter_id UUID;
    v_first_game_id UUID;
BEGIN
    -- Validar Configuração Esportiva
    SELECT * INTO v_config FROM public.championship_settings 
    WHERE championship_id = p_championship_id AND tenant_id = p_tenant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Configuração esportiva não encontrada para o campeonato.';
    END IF;

    IF v_config.sport <> 'truco' OR v_config.format <> 'direct_match' THEN
        RAISE EXCEPTION 'Apenas o esporte "truco" e formato "direct_match" são suportados nesta versão.';
    END IF;

    -- Validar Equipes e obter em ordem determinística
    SELECT COUNT(*) INTO v_team_count FROM public.teams 
    WHERE championship_id = p_championship_id;

    IF v_team_count <> 2 THEN
        RAISE EXCEPTION 'O campeonato deve ter exatamente 2 equipes (tem %).', v_team_count;
    END IF;

    -- Pegar IDs ordenados
    SELECT id INTO v_team_a_id FROM public.teams 
    WHERE championship_id = p_championship_id ORDER BY name ASC, id ASC LIMIT 1;
    
    SELECT id INTO v_team_b_id FROM public.teams 
    WHERE championship_id = p_championship_id ORDER BY name ASC, id ASC OFFSET 1 LIMIT 1;

    -- Idempotência: Checar se o stage 'elimination' já existe
    SELECT id INTO v_stage_id FROM public.tournament_stages 
    WHERE championship_id = p_championship_id AND type = 'elimination' FOR UPDATE;

    IF v_stage_id IS NOT NULL THEN
        -- Já foi gerado, pegar os IDs do encounter e game 1
        SELECT id INTO v_encounter_id FROM public.encounters WHERE stage_id = v_stage_id LIMIT 1;
        SELECT id INTO v_first_game_id FROM public.matches WHERE encounter_id = v_encounter_id AND game_number = 1 LIMIT 1;
        
        RETURN json_build_object(
            'generated', false,
            'stage_id', v_stage_id,
            'encounter_id', v_encounter_id,
            'first_game_id', v_first_game_id
        );
    END IF;

    -- Geração Inédita Atômica
    
    -- Inserir Stage
    INSERT INTO public.tournament_stages (championship_id, tenant_id, name, type, status)
    VALUES (p_championship_id, p_tenant_id, 'Fase Eliminatória', 'elimination', 'scheduled')
    RETURNING id INTO v_stage_id;

    -- Calcular wins_required (Melhor de N -> (N/2)+1 para números ímpares, mas a matemática segura é (best_of / 2) + 1 para inteiros onde 3 -> 2, 5 -> 3)
    v_wins_required := (v_config.best_of / 2) + 1;

    -- Inserir Encounter
    INSERT INTO public.encounters (stage_id, championship_id, tenant_id, team_a_id, team_b_id, best_of, wins_required, status)
    VALUES (v_stage_id, p_championship_id, p_tenant_id, v_team_a_id, v_team_b_id, v_config.best_of, v_wins_required, 'scheduled')
    RETURNING id INTO v_encounter_id;

    -- Inserir Queda 1 (Game) na tabela matches
    INSERT INTO public.matches (
        championship_id, 
        team_a_id, 
        team_b_id, 
        team_a_score, 
        team_b_score, 
        status, 
        encounter_id, 
        game_number
    )
    VALUES (
        p_championship_id, 
        v_team_a_id, 
        v_team_b_id, 
        0, 
        0, 
        'scheduled', 
        v_encounter_id, 
        1
    )
    RETURNING id INTO v_first_game_id;

    RETURN json_build_object(
        'generated', true,
        'stage_id', v_stage_id,
        'encounter_id', v_encounter_id,
        'first_game_id', v_first_game_id
    );
END;
$$ LANGUAGE plpgsql;
