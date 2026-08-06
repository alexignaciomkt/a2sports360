# Resolution Engine
**Estado:** Implementado (Sprint 12)

**Responsabilidade:** Resolver uma Queda finalizada (Homologar). Decidir se soma ponto na série, encerra o Confronto ou cria a Próxima Queda (avançando a numeração sequencial).
**Tabelas:** `encounters`, `matches`, `game_tables`, `match_sessions`.
**O que NÃO conhece:** Telões, Pontuações atômicas internas de uma queda.
**RPCs:** `resolve_finished_game`.