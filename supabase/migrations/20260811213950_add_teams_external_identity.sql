-- Migration: Adicionar suporte à identidade externa nas equipes (A2TICKETS360)

-- 1. Adicionar colunas source_system e external_team_id
ALTER TABLE public.teams
ADD COLUMN source_system text NULL,
ADD COLUMN external_team_id uuid NULL;

-- 2. Criar índice unique parcial para garantir idempotência de registros externos
CREATE UNIQUE INDEX uq_teams_external_identity ON public.teams (source_system, external_team_id) 
WHERE source_system IS NOT NULL AND external_team_id IS NOT NULL;

-- 3. Criar RPC para registro idempotente de duplas externas
CREATE OR REPLACE FUNCTION public.register_external_team_with_players(
    p_championship_id uuid,
    p_team_name text,
    p_source_system text,
    p_external_team_id uuid,
    p_players json
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_champ_exists boolean;
    v_team_id uuid;
    v_existing_team_id uuid;
    v_player_record json;
    v_p_id uuid;
    v_pos int := 1;
BEGIN
    -- 1. Lock do campeonato para serializar operações
    PERFORM 1 FROM public.championships WHERE id = p_championship_id FOR UPDATE;

    -- 2. Validar que campeonato existe
    SELECT EXISTS (
        SELECT 1 
        FROM public.championships 
        WHERE id = p_championship_id
    ) INTO v_champ_exists;
    
    IF NOT v_champ_exists THEN
        RAISE EXCEPTION 'Campeonato não encontrado.';
    END IF;

    -- 3. Verificar se já existe a equipe externa
    SELECT id INTO v_existing_team_id 
    FROM public.teams 
    WHERE source_system = p_source_system 
      AND external_team_id = p_external_team_id;

    IF FOUND THEN
        -- Atualiza nome da equipe
        UPDATE public.teams 
        SET name = p_team_name
        WHERE id = v_existing_team_id;

        -- (Opcional: aqui poderíamos atualizar jogadores. Para esta fase, faremos o safe update só do nome da equipe 
        -- dado que a equipe já existe e recriar os vínculos pode quebrar chaves de encontros caso já iniciados)

        RETURN json_build_object(
            'success', true,
            'created', false,
            'team_id', v_existing_team_id
        );
    END IF;

    -- 4. Criar nova equipe
    INSERT INTO public.teams (championship_id, name, status, source_system, external_team_id)
    VALUES (p_championship_id, p_team_name, 'approved', p_source_system, p_external_team_id)
    RETURNING id INTO v_team_id;

    -- 5. Inserir jogadores a partir do JSON recebido
    FOR v_player_record IN SELECT * FROM json_array_elements(p_players)
    LOOP
        INSERT INTO public.players (name, phone)
        VALUES (
            v_player_record->>'name',
            v_player_record->>'phone'
        )
        RETURNING id INTO v_p_id;

        INSERT INTO public.team_players (team_id, player_id, position)
        VALUES (v_team_id, v_p_id, v_pos);

        v_pos := v_pos + 1;
    END LOOP;

    -- 6. Retornar
    RETURN json_build_object(
        'success', true,
        'created', true,
        'team_id', v_team_id
    );
END;
$$;
