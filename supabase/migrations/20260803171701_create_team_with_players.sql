-- Migration: Criação Atômica de Dupla
-- Add unique constraint for championship teams to enforce idempotency
ALTER TABLE public.teams
ADD CONSTRAINT uq_championship_team_name UNIQUE (championship_id, name);

-- Create RPC for atomic team creation
CREATE OR REPLACE FUNCTION public.create_team_with_players(
    p_tenant_id uuid,
    p_championship_id uuid,
    p_team_name text,
    p_player1_name text,
    p_player1_phone text,
    p_player2_name text,
    p_player2_phone text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_champ_exists boolean;
    v_team_count int;
    v_team_id uuid;
    v_p1_id uuid;
    v_p2_id uuid;
BEGIN
    -- 1. Validar que o campeonato pertence ao tenant
    SELECT EXISTS (
        SELECT 1 
        FROM public.championships 
        WHERE id = p_championship_id AND tenant_id = p_tenant_id
    ) INTO v_champ_exists;
    
    IF NOT v_champ_exists THEN
        RAISE EXCEPTION 'Campeonato não encontrado ou sem acesso.';
    END IF;

    -- 2. Idempotência / Prevenção de duplicatas (além da constraint)
    IF EXISTS (
        SELECT 1 
        FROM public.teams 
        WHERE championship_id = p_championship_id 
        AND lower(name) = lower(p_team_name)
    ) THEN
        RAISE EXCEPTION 'Já existe uma equipe com este nome neste campeonato.';
    END IF;

    -- 3. Bloquear de forma segura e contar as equipes (max 2)
    -- Dá lock na linha do campeonato para serializar inserções de equipes
    PERFORM 1 FROM public.championships WHERE id = p_championship_id FOR UPDATE;
    
    SELECT COUNT(id) INTO v_team_count
    FROM public.teams
    WHERE championship_id = p_championship_id;

    IF v_team_count >= 2 THEN
        RAISE EXCEPTION 'Limite de 2 duplas atingido para a Mesa Única.';
    END IF;

    -- 4. Criar a equipe
    INSERT INTO public.teams (championship_id, name, status)
    VALUES (p_championship_id, p_team_name, 'approved')
    RETURNING id INTO v_team_id;

    -- 5. Criar Jogador 1
    INSERT INTO public.players (name, phone)
    VALUES (p_player1_name, p_player1_phone)
    RETURNING id INTO v_p1_id;

    -- 6. Criar Jogador 2
    INSERT INTO public.players (name, phone)
    VALUES (p_player2_name, p_player2_phone)
    RETURNING id INTO v_p2_id;

    -- 7. Criar os vínculos em team_players
    INSERT INTO public.team_players (team_id, player_id, position)
    VALUES 
        (v_team_id, v_p1_id, 1),
        (v_team_id, v_p2_id, 2);

    -- 8. Retornar resultado sanitizado
    RETURN json_build_object(
        'success', true,
        'team_id', v_team_id,
        'player1_id', v_p1_id,
        'player2_id', v_p2_id
    );
END;
$$;
