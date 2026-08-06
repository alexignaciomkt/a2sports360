# Sprint 15A: Controle Operacional por ResourceId

**Status: Em Validação Funcional**

## Resumo Executivo

Migração completa do Controle Operacional da rota legada `/championships/[id]/table/1` (identidade por number hardcoded) para a rota canônica `/championships/[id]/resources/[resourceId]/control` (identidade por `resourceId`). Eliminação total da derivação de identidade por `displayName` ou `number` em todo o dashboard e páginas referentes.

### Regra Arquitetural Estabelecida

> **A identidade operacional do Local é exclusivamente o `resourceId`. `display_name` é apresentação. `number` é compatibilidade legada.**

## Arquivos Criados

- `src/app/(dashboard)/championships/[id]/resources/[resourceId]/control/page.tsx` — Página de controle operacional com 6 estados (local livre, local ocupado, estado inconsistente, sessão ativa, sessão ocupada, sessão expirada).
- `src/app/(dashboard)/championships/[id]/resources/[resourceId]/control/actions.ts` — Server Actions com validação completa (user, tenant, championship, resource, vínculo, match, sessão). `matchId` resolvido server-side via `resource.activeGameId`.
- `src/app/(dashboard)/championships/[id]/resources/[resourceId]/control/scoreboard-client.tsx` — Componente de placar migrado para usar `resourceId`.

## Arquivos Modificados

- `src/app/(dashboard)/championships/[id]/table/1/page.tsx` — Convertido em redirect server-side para rota canônica.
- `src/app/(dashboard)/championships/[id]/table/setup/page.tsx` — Convertido em redirect para `/arenas`.
- `src/app/(dashboard)/championships/[id]/operation/dashboard-client.tsx` — Link de controle usa `resource.id` (removido `displayName.replace()`).
- `src/app/(dashboard)/championships/[id]/match/page.tsx` — Link de controle usa rota canônica. Texto "Mesa 1" eliminado.
- `src/app/(dashboard)/championships/[id]/match/actions.ts` — Removido `revalidatePath('/public/table/1')` hardcoded.
- `src/app/(dashboard)/championships/[id]/components/championship-journey.tsx` — Telão Público usa `resource.number` real (não hardcode `1`). "Mesa 1 finalizada" → "O confronto foi finalizado".
- `src/app/(dashboard)/championships/[id]/page.tsx` — Eliminado acesso direto a `game_tables` (Repository Rule). Usa `ResourceService`.

## Arquivos Removidos

- `src/app/(dashboard)/championships/[id]/table/1/actions.ts` — Auditoria confirmou zero imports.
- `src/app/(dashboard)/championships/[id]/table/1/scoreboard-client.tsx` — Auditoria confirmou zero imports.

## Decisões Arquiteturais

- **Assinaturas das Server Actions**: `registerPoint(championshipId, resourceId, teamId, points, deviceId)` e `undoLastPoint(championshipId, resourceId)`. Nenhuma Action aceita `matchId` do client.
- **Cookie Path**: Migrado de `/championships/[id]/table` para `/championships/[id]`. Na primeira execução pela nova rota, o cookie legado é removido explicitamente antes de gravar o novo.
- **Troca de Queda**: Após resolução, `revalidatePath` da rota canônica. A página resolve o novo `current_match_id` server-side.
- **Display Público**: Mantido em `/public/table/[number]` como rota legada temporária. QR permanente futuro documentado como `/r/[resourceId]`.
- **Repository Rule**: Eliminado acesso direto a `game_tables` na página do campeonato.

## Quality Gates

- `pnpm exec tsc --noEmit` ✅
- `pnpm exec eslint .` (Em validação)
- `pnpm run build` (Pendente)
