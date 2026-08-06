# Sprint 15: Operational Dashboard V1

**Status: Em Validação Funcional**

## Resumo Executivo
Implementação da primeira versão do Dashboard Operacional (`/championships/[id]/operation`). Este dashboard atua como a interface principal para os operadores controlarem o andamento do torneio, visualizarem a disponibilidade de infraestrutura e orquestrarem o despacho (automático e manual) de confrontos.

## Arquivos Criados / Modificados
- `src/app/(dashboard)/championships/[id]/operation/page.tsx` [NEW]
- `src/app/(dashboard)/championships/[id]/operation/dashboard-client.tsx` [NEW]
- `src/app/(dashboard)/championships/[id]/operation/actions.ts` [NEW]
- `src/domains/operation/operation.service.ts` [MODIFY]
- `src/domains/operation/operation.types.ts` [MODIFY]
- `src/domains/operation/operation.repository.ts` [MODIFY]
- `src/app/(dashboard)/championships/[id]/page.tsx` [MODIFY]
- `src/app/(dashboard)/championships/[id]/components/championship-journey.tsx` [MODIFY]

## Decisões Arquiteturais
- **Polling Inteligente**: O dashboard recarrega dados a cada 5 segundos através de uma Server Action (`fetchDashboardSnapshot`). O polling pausa se a janela do navegador perder visibilidade, economizando recursos.
- **Snapshot Operacional**: A UI não recebe registros brutos do banco de dados. O `OperationService` orquestra uma visão sumarizada (`OperationalDashboardSnapshot`) garantindo a abstração do banco e encapsulamento de regras.
- **Autoridade do Servidor**: Funções de despacho continuam sendo processadas apenas no servidor, por intermédio das Server Actions seguras, garantindo a integridade transacional das chamadas RPC implementadas na Sprint 14.

## Quality Gates e Entrega
- Tipagens ajustadas e erros de linter (any) estritamente proibidos e erradicados da camada de operações e frontend relacionado.
- Validação completa com `pnpm exec tsc --noEmit` e `pnpm run build` aprovada.
