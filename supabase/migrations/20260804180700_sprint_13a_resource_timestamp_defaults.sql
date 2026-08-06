-- ==============================================================================
-- BUGFIX SPRINT 13A - RESOURCE TIMESTAMP DEFAULTS
-- ==============================================================================
-- A migration anterior adicionou as colunas created_at e updated_at como 
-- NOT NULL, mas esqueceu de incluir a cláusula DEFAULT now(), o que fez 
-- com que o TypeScript exigisse esses campos técnicos nos inserts.
-- ==============================================================================

ALTER TABLE public.game_tables
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();
