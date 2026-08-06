-- Migration: Limpeza de dados inconsistentes de testes
DO $$
DECLARE
    v_champ_id uuid := '20af50eb-ef44-4f1a-b8f2-5d131fe0d81c';
BEGIN
    -- 1. Remover match_events relacionadas
    DELETE FROM public.match_events 
    WHERE match_id IN (SELECT id FROM public.matches WHERE championship_id = v_champ_id);

    -- 2. Remover match_sessions relacionadas
    DELETE FROM public.match_sessions 
    WHERE match_id IN (SELECT id FROM public.matches WHERE championship_id = v_champ_id);

    -- 3. Remover matches relacionadas
    DELETE FROM public.matches 
    WHERE championship_id = v_champ_id;

    -- 4. Identificar jogadores associados às equipes que serão deletadas
    CREATE TEMP TABLE tmp_players_to_delete AS
    SELECT player_id 
    FROM public.team_players 
    WHERE team_id IN (SELECT id FROM public.teams WHERE championship_id = v_champ_id);

    -- 5. Remover vínculos team_players
    DELETE FROM public.team_players 
    WHERE team_id IN (SELECT id FROM public.teams WHERE championship_id = v_champ_id);

    -- 6. Remover equipes (teams) do campeonato de teste
    DELETE FROM public.teams 
    WHERE championship_id = v_champ_id;

    -- 7. Remover jogadores (players) agora órfãos
    DELETE FROM public.players 
    WHERE id IN (SELECT player_id FROM tmp_players_to_delete);
    
    DROP TABLE tmp_players_to_delete;
END $$;
