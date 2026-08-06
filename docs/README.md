# A2Sports360 - Documentação Oficial

## Visão do Produto
A A2Sports360 é uma plataforma B2B/B2B2C de gestão de competições esportivas. Ela transforma ingressos e configurações esportivas em confrontos reais, gerenciando desde a estrutura da série (Série de Jogos) até a ocupação do recurso físico (Mesas/Quadras).

## Objetivo da Plataforma
Separar completamente a responsabilidade de "venda de ingressos" (A2Tickets) da "execução esportiva" (A2Sports), oferecendo um motor agnóstico a esportes, auditável e altamente escalável para campeonatos simultâneos (Multi-Tenant).

## Arquitetura e Motores
A arquitetura é guiada por uma separação de responsabilidades (Engines):
- **Competition Engine**: Regras do Campeonato, Equipes, Configurações de Esporte (Sprint 08).
- **Tournament Engine**: Estrutura do Torneio, Chaveamento, Fases, Encounters (Sprint 09).
- **Match Engine**: Execução e regras de uma Queda e Série, definindo vitórias e avanços (Planejado Sprint 11).
- **Resource Engine**: Entidades Físicas (Mesas, Quadras, etc) (Sprint 10).
- **Operation Engine**: Despacho, Fila, Alocação, Atribuição de Confrontos para Recursos.
- **Score Engine**: Ponto a ponto, Histórico, Undo (Sprint 05).
- **Validation/Display Engine**: Placar em tempo real (Realtime), Homologação (Planejado).

## Stack Tecnológico
- Frontend: Next.js 14+ (App Router), TailwindCSS, TypeScript.
- Backend: Supabase (PostgreSQL, RPCs para atomicidade de score e transações, Row Level Security).
- Tooling: pnpm, ESLint, TypeScript.

## Ordem Recomendada de Leitura
1. `00-product/Current-State.md`
2. `07-decisions/001-A2Tickets-vs-A2Sports.md`
3. `01-architecture/*`
4. `04-flows/*`
5. `08-handover/Developer-Onboarding.md`
