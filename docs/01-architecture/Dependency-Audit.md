# Dependency Audit Report — Sprint 13C

**Data:** 04 de Agosto de 2026
**Sprint:** 13C — Platform Hardening

---

## 1. Domain Boundaries Violations (Imports Cruzados)

**Status:** Saudável.

Não foram detectados imports ilegais cruzando a fronteira de repositórios entre domínios. Todos os repositórios estão isolados em suas próprias pastas. Com a introdução do conceito de Public API (`index.ts`) nesta Sprint, futuras validações podem garantir que os imports passem apenas pelo barrel export de cada Engine.

---

## 2. Acessos Diretos ao Supabase no App Router

**Status:** Dívida técnica catalogada para migração gradual.

Os acessos diretos à tabela `game_tables` nas rotas auditadas foram eliminados na Sprint 13C. Permanecem acessos diretos a outras tabelas no App Router, catalogados abaixo para migração gradual.

### Inventário Completo

| # | Arquivo | Tabelas Acessadas | Tipo de Operação | Candidato a Repository | Prioridade |
|---|---------|-------------------|------------------|----------------------|------------|
| 1 | `src/app/public/table/[number]/page.tsx` | `matches`, `teams` | Leitura simples | `MatchRepository`, `ChampionshipRepository` | **Média** |
| 2 | `src/app/api/internal/tickets/create-championship/route.ts` | `tenant_mappings`, `championships` | Leitura + Escrita | `IntegrationRepository` | **Baixa** (já é uma API interna isolada) |
| 3 | `src/app/(dashboard)/championships/[id]/teams/page.tsx` | `championships`, `teams`, `team_players`, `players` | Leitura simples | `ChampionshipRepository` | **Média** |
| 4 | `src/app/(dashboard)/championships/[id]/table/setup/page.tsx` | `championships`, `teams` | Leitura simples | `ChampionshipRepository` | **Média** |
| 5 | `src/app/(dashboard)/championships/[id]/table/1/page.tsx` | `championships`, `matches`, `teams` | Leitura simples | `ChampionshipRepository`, `MatchRepository` | **Média** |
| 6 | `src/app/(dashboard)/championships/[id]/table/1/actions.ts` | `matches`, `match_sessions` | Leitura + Escrita (operação crítica) | `MatchRepository` (leitura), novo `SessionRepository` (escrita) | **Alta** |
| 7 | `src/app/(dashboard)/championships/[id]/results/page.tsx` | `championships`, `matches`, `teams` | Leitura simples | `ChampionshipRepository`, `MatchRepository` | **Baixa** |
| 8 | `src/app/(dashboard)/championships/[id]/page.tsx` | `teams`, `encounters`, `matches` | Leitura simples | `ChampionshipRepository`, `MatchRepository` | **Média** |
| 9 | `src/app/(dashboard)/championships/[id]/match/page.tsx` | `championships`, `teams`, `championship_settings`, `encounters`, `matches` | Leitura simples | `ChampionshipRepository`, `MatchRepository` | **Média** |

### Detalhamento por Tipo

**Leitura Simples** (7 ocorrências — itens 1, 3, 4, 5, 7, 8, 9):
Consultas `SELECT` para compor dados de tela. Não alteram estado. São as migrações mais seguras e previsíveis.

**Leitura + Escrita** (1 ocorrência — item 2):
A rota de API interna (`create-championship`) faz insert em `championships`. Já está encapsulada como endpoint de integração externa. Prioridade baixa porque o `IntegrationService` existente pode absorver esta lógica em Sprint futura sem impacto em UI.

**Operação Crítica** (1 ocorrência — item 6):
A action `ensureControlSession` em `table/1/actions.ts` faz leitura de `matches` e **escrita em `match_sessions`** (insert de sessão de controle). Esta é a ocorrência de maior risco porque mistura criação de sessão com verificação de estado de partida em uma Server Action, sem intermediação de Service. Prioridade alta.

---

## 3. Lógica Repetida / Acessos RPC

**Status:** Saudável.

As Server Actions responsáveis por mutações críticas já estão delegando adequadamente para os Services de domínio:
- `ResolutionService.resolveGame`
- `MatchService.generateMatch`
- `OperationService.dispatch`

Os RPCs `register_match_event` e `undo_match_event` são chamados via `supabase.rpc()` em `table/1/actions.ts`. Embora tecnicamente sejam acessos diretos, estão encapsulados em Server Actions e são candidatos naturais ao futuro `ScoreRepository`.

---

## 4. Proposta de Migração

A migração será gradual e não retroativa:
1. **Sprint 14 (sugestão):** Migrar os itens de prioridade **Alta** (item 6 — `actions.ts` com escrita em `match_sessions`).
2. **Sprints seguintes:** Migrar os itens de prioridade **Média** à medida que os Engines forem sendo fortalecidos.
3. **Itens de prioridade Baixa** serão migrados oportunisticamente.
