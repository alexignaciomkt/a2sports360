# Catálogo de Migrations

- **20260801120000_init_schema.sql**: Criação da base Multi-tenant.
- **20260801130000_harden_security.sql**: Hardening de RLS e Security Definer.
- **20260802143000_tickets_integration.sql**: Webhooks A2Tickets.
- **20260802193120_sprint_05_game_logic.sql**: Game Logic (RPCs register/undo match_event).
- **20260803154800_operation_engine_dispatch.sql**: Dispatch Match para mesa (Legado).
- **20260804000000_sprint_08_sports_config.sql**: `championship_settings`.
- **20260804092500_sprint_09_tournament_engine.sql**: Criação de `encounters`, melhor-de-n.
- **20260804101000_sprint_10_resource_encounter.sql**: Correção arquitetural: Mesa recebe Encounter.
- **20260804131800_sprint_12_resolution_engine.sql**: Resolution Engine V1 (resolve_finished_game, resolved_at).
- **20260804154600_sprint_13a_arena_infrastructure.sql**: Resource Infrastructure V2. Evolução da game_tables, backfill seguro, RLS multi-tenant, e criação atômica em lote de Arenas.
- **20260804180700_sprint_13a_resource_timestamp_defaults.sql**: Correção de infraestrutura para adicionar `DEFAULT now()` em `created_at` e `updated_at` na tabela `game_tables`, aliviando o client da responsabilidade de gerenciar colunas técnicas exigidas como NOT NULL.
- **20260804183300_sprint_13a_qr_token_fix.sql**: Fix da geração de qr_token na RPC configure_championship_resources de gen_random_bytes(16) para REPLACE(gen_random_uuid()::text, '-', '') para evitar dependência do pgcrypto.