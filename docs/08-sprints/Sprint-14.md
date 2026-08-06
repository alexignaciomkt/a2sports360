# Sprint 14 — Operation Engine V2 (Orquestração Operacional)

**Data:** 05 de Agosto de 2026
**Status:** Em Validação

---

## Objetivo

Transformar o Operation Engine no Orquestrador Operacional Oficial da Plataforma, responsável por decidir quando e onde cada confronto acontece. Implementar despacho automático em lote com fila por campeonato.

## Diretriz Permanente

A partir desta Sprint, fica estabelecido que:

- O **Tournament Engine** cria os confrontos.
- O **Operation Engine** decide quando e onde eles acontecem.
- O **Resource Engine** representa a infraestrutura física.
- O **Resolution Engine** encerra a execução de cada confronto.

---

## Entregas

### 1. Migration

`supabase/migrations/20260805000000_sprint_14_operation_engine_v2.sql`

**Parte 1 — Bug Fix:** Adicionada `matches.updated_at` (nullable, `DEFAULT now()`). Três RPCs existentes (`dispatch_encounter_to_resource`, `resolve_finished_game`, `register_match_event`) referenciavam esta coluna que nunca havia sido criada.

**Parte 2 — Lock Order Fix:** Reescrita de `dispatch_encounter_to_resource` com ordem correta de locks: championship → encounter → match → resource.

**Parte 3 — Nova RPC:** `process_dispatch_queue` — despacho determinístico em lote com subtransações por pareamento.

### 2. Domínio TypeScript

- `src/domains/operation/operation.types.ts` — Novos tipos: `DispatchQueueResult`, `DispatchAssignment`, `SkippedEncounter`, `OperationalDashboardSnapshot`.
- `src/domains/operation/operation.repository.ts` — Novos métodos: `processDispatchQueue`, `getScheduledEncounters`, `getEncounterCounts`.
- `src/domains/operation/operation.service.ts` — Novos métodos: `processQueue`, `getOperationalSnapshot`.
- `src/domains/operation/index.ts` — Public API atualizada.

### 3. Gatilhos

- `src/app/(dashboard)/championships/[id]/match/actions.ts` — `generateMatch` agora invoca `processQueue` após o Tournament Command.
- `src/app/(dashboard)/championships/[id]/match/actions.ts` — `resolveMatch` agora invoca `processQueue` após encounter_finished.

### 4. Documentação

- `docs/07-decisions/ADR-013-OperationOrchestration.md`
- `docs/01-architecture/OperationEngine.md`
- `docs/01-architecture/Domain-Boundaries.md`
- `docs/00-product/Current-State.md`
- `docs/09-roadmap/Architecture-Roadmap.md`

---

## Decisões Técnicas

### Política de Locks

Ordem global obrigatória: championship primeiro. Toda Command operacional inicia bloqueando o championship via FOR UPDATE. Isso serializa todas as operações do mesmo campeonato. Commands de campeonatos diferentes podem executar em paralelo.

### Fila por Campeonato

A fila V1 é exclusivamente por `championship_id`. Não existe fila cross-championship.

### Estados

Não foram adicionados novos estados. Encounters: `scheduled`, `in_progress`, `finished`. Resources: `available`, `occupied`.

### Subtransações

Cada pareamento possui rollback isolado via `BEGIN...EXCEPTION...END`. Exceções capturadas: `NO_DATA_FOUND` e `raise_exception`. `WHEN OTHERS` proibido.
## Pendência Técnica

Investigar por que a CLI utilizou `localhost` ao invés do DB remoto durante o `db push --dry-run`.
Resultado esperado: `db push` e `db push --dry-run` funcionando igualmente com a URL remota em nosso ambiente CI/CD/Dev.
### Separação entre Commands

Cada Command é autocontida. Falha na fila não reverte Tournament ou Resolution anteriores. Retry é idempotente.

---

## Compatibilidade Retroativa

- `dispatch_encounter_to_resource` mantida como fallback manual.
- Todos os fluxos existentes continuam funcionando.
- `current_encounter_id` e `current_match_id` mantidos.
- Resolution Engine continua responsável pela liberação final.
