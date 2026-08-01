-- Remover policies com SELECT global
DROP POLICY IF EXISTS "public_read_match_events" ON public.match_events;
DROP POLICY IF EXISTS "public_read_game_tables" ON public.game_tables;
DROP POLICY IF EXISTS "public_read_matches" ON public.matches;

-- Garantir que a RPC não possa ser executada por papéis com menos privilégios
REVOKE EXECUTE ON FUNCTION public.register_match_event(UUID, TEXT, TEXT, UUID, INT, TEXT, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.register_match_event(UUID, TEXT, TEXT, UUID, INT, TEXT, JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.register_match_event(UUID, TEXT, TEXT, UUID, INT, TEXT, JSONB) FROM authenticated;
