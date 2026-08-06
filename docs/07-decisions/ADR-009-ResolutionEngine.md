# ADR-009: Resolution Engine
**Problema**: Delegar a resolução do Encounter (verificar vitórias, criar próxima queda) via Node/Typescript seria propício a falhas de rede, race conditions (múltiplos "next games" gerados por retries) e assincronia.
**Alternativas**: Usar filas no backend ou deixar a UI decidir o estado.
**Solução**: Construir o `Resolution Engine` inteiramente ancorado numa RPC Transacional (`resolve_finished_game`) que usa o estado da Mesa (`current_match_id`) e `resolved_at` para idempotência estrita sob bloqueio `FOR UPDATE`.
**Consequências**: Operações 100% seguras contra duplo clique. A lógica esportiva e de recursos se funde perfeitamente com integridade atômica.