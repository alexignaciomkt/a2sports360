# Score Engine
**Estado:** Implementado (Sprint 05)

**Responsabilidade:** Receber comandos atômicos de pontuação, calcular soma, garantir limite de pontos (`target_score`), emitir undo.
**RPCs:** `register_match_event`, `undo_match_event`.
**O que NÃO conhece:** Se ao atingir a pontuação alvo, a série de 3 jogos acabou. Isso é com o Match Engine.