# Operation Engine

**Status:** Consolidado — Operation Engine V2 (Sprint 14)

**Responsabilidade:** O Operation Engine é o Orquestrador Operacional Oficial da Plataforma. Ele é responsável por decidir quando, onde e em qual ordem os confrontos acontecem, além de orquestrar a utilização operacional de toda a infraestrutura física dos eventos esportivos.

**O que conhece:**
- Estados de Encounters (scheduled, in_progress, finished).
- Estados de Resources (available, occupied).
- Regras de pareamento e despacho.

**O que NÃO conhece e NÃO faz:**
- Regras esportivas (Match Engine).
- Pontuação, placar e interpretação do catálogo esportivo (Sport Event Engine).
- Quem vence e quando (Resolution Engine).
- Geração de chaveamento (Tournament Engine).
- Geração de estatísticas (Analytics Engine).
- Desenho de telas ou exibições de telão (Projections).
O Operation Engine apenas *recebe Commands*, decide alocações e produz novos estados operacionais.

**Capacidades:**
- **Despacho Manual (V1):** `dispatch_encounter_to_resource` — despacho unitário com idempotência, fallback administrativo.
- **Despacho Automático (V2):** `process_dispatch_queue` — pareamento determinístico em lote entre Encounters scheduled e Resources available.
- **Controle de Sessão Operacional (V3):** (Sprint 14C) `ensure_control_session` / `take_over_control_session` — autoridade segura via httpOnly cookie, resolvendo bugs de assincronia e roubo de sessão.
- **Controle Operacional por ResourceId (V4):** (Sprint 15A) Rota canônica `/championships/[id]/resources/[resourceId]/control`. Server Actions validam user/tenant/championship/resource/vínculo/match/sessão. `matchId` resolvido server-side via `resource.activeGameId`, nunca recebido do client.
- **Score Event Engine (V5):** (Sprint 15C) Evolução do Scoreboard para consumir um **Catálogo de Eventos Oficial** (`ScoreAction`), operando estritamente por deltas e não placares absolutos. Desacopla regras esportivas da interface. O atributo `analyticsKey` em cada ação servirá como fonte de verdade para BI, Replay, Display Engine e Narração por IA, assegurando inteligência estatística limpa (ex: `"analyticsKey": "seis"` vs `"analyticsKey": "ponto_simples"` conferindo `+6`).
- **Contexto Operacional:** `getTableOperationalContext` — avaliação do estado de um Resource específico.
- **Snapshot Operacional:** `getOperationalSnapshot` — visão consolidada do estado do campeonato para o Dashboard (Sprint 15).

**Commands (RPCs):**
- `dispatch_encounter_to_resource(p_tenant_id, p_championship_id, p_encounter_id, p_resource_id)`
- `process_dispatch_queue(p_tenant_id, p_championship_id)`

**Política de Despacho V1:**
- Resources: `ORDER BY display_order ASC, id ASC`
- Encounters: `ORDER BY created_at ASC, id ASC`

**Política de Locks:**
Ordem global obrigatória: championship primeiro (`FOR UPDATE`). Após esse lock, a Command pode bloquear as entidades necessárias. Commands do mesmo campeonato são serializadas. Commands de campeonatos diferentes executam em paralelo.

**Gatilhos:**
- Após Tournament Command (geração de chaveamento).
- Após Resolution Command (finalização de encounter com liberação de Resource).

**Fila:** Exclusivamente por `championship_id`. Não existe fila cross-championship.

**QR Permanente (Futuro):**
O QR code permanente para acesso público ao Local usará a rota `/r/[resourceId]` e não a rota interna autenticada de controle (`/championships/[id]/resources/[resourceId]/control`). A rota pública atual `/public/table/[number]` é legada e temporária.