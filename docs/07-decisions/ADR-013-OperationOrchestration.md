# ADR 013: Operation Orchestration (Operation Engine V2)

**Data:** 05 de Agosto de 2026
**Status:** Aceito

## Contexto

O Operation Engine existente (V1) era limitado a despacho manual unitário: o organizador precisava clicar em "Despachar" para cada confronto individualmente. Com o crescimento da plataforma para múltiplos Resources e múltiplos Encounters simultâneos, o despacho manual tornou-se operacionalmente inviável.

## Decisão

### 1. Fila de Despacho Automático

Criada a RPC `process_dispatch_queue(p_tenant_id, p_championship_id)` que realiza pareamento determinístico em lote entre Encounters `scheduled` e Resources `available`.

### 2. Política de Despacho V1

- **Resources:** `ORDER BY display_order ASC, id ASC`
- **Encounters:** `ORDER BY created_at ASC, id ASC`

Política determinística simples. Sem prioridades, rankings ou reservas nesta versão.

### 3. Fila por Campeonato

A fila V1 é exclusivamente por `championship_id`. Não existe fila cross-championship. Resources pertencem ao campeonato, regras e fases são isoladas por campeonato, e não há competição entre eventos distintos.

### 4. Política de Locks

Ordem global obrigatória: **championship primeiro**. Toda Command operacional (`dispatch_encounter_to_resource`, `process_dispatch_queue`, `resolve_finished_game`) inicia bloqueando o `championship` via `FOR UPDATE`. Isso serializa todas as operações que afetam encounters, matches e resources de um mesmo campeonato. Commands de campeonatos diferentes podem executar em paralelo sem interferência.

### 5. Subtransações por Pareamento

Cada pareamento (Resource ← Encounter) é isolado em um bloco `BEGIN...EXCEPTION...END` com savepoint implícito do PostgreSQL. Se qualquer UPDATE falhar, apenas aquele pareamento sofre rollback. Os demais continuam normalmente.

### 6. Exceções Específicas

É proibido `WHEN OTHERS`. Apenas `WHEN NO_DATA_FOUND` e `WHEN raise_exception` são capturadas. Bugs estruturais abortam a transação inteira.

### 7. Estados Derivados

Não foram adicionados novos estados (`waiting`, `dispatched`, `blocked`, `maintenance`). Um Encounter `scheduled` sem Resource associado está implicitamente "aguardando despacho". Novos estados só entram quando possuírem comando, transição, validação, recuperação, UI e documentação operacional.

### 8. Gatilhos

A fila é processada automaticamente em dois pontos:
- Após o Tournament Command gerar chaveamento.
- Após o Resolution Engine finalizar um encounter e liberar o Resource.

### 9. Separação entre Commands

Cada Command é autocontida. Se `processQueue` falhar após um Tournament ou Resolution Command bem-sucedido, o Command anterior não é revertido. A fila é idempotente e aceita retry manual.

### 10. Fallback Manual

O despacho manual unitário (`dispatch_encounter_to_resource`) permanece disponível como fallback administrativo.

## Consequências

- **Positivas:** Operação de grandes campeonatos (50+ encounters, 10+ resources) passa a ser viável. O organizador não precisa despachar manualmente cada confronto. A arquitetura suporta evolução para políticas futuras (prioridade, ranking, transmissão, árbitro específico) sem alterar a RPC base.
- **Negativas:** O lock do championship serializa operações, o que pode gerar contenção em cenários de altíssima concorrência. Aceitável para V1.
