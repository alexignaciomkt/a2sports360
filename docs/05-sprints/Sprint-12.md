# Sprint 12
**Objetivo**: Resolution Engine V1. Homologação Atômica da Queda e Progressão do Confronto.
**Problema que originou a Sprint**: A finalização da queda não progredia o Encounter nem libertava a mesa com segurança em séries melhor de N.
**Estado anterior**: register_match_event mantinha a mesa congelada após Game 1.
**Decisões tomadas**: Criar a RPC transacional `resolve_finished_game` para atuar como fonte da verdade.
**Arquitetura criada**: Resolution Engine (Domain, Service, Repository).
**Migrations**: 20260804131800_sprint_12_resolution_engine.sql.
**RPCs**: resolve_finished_game.
**Fluxos afetados**: Pós-partida.
**Limitações**: Validação bilateral e contestação pendentes.
**Corre��o de UX:** Ajuste da ordem da Jornada Operacional para (1) Equipes -> (2) Confronto -> (3) Mesa 1, refletindo corretamente a depend�ncia de um Encounter antes do despacho da Mesa.
