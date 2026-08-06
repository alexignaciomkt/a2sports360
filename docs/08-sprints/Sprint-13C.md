# Sprint 13C — Platform Hardening (Consolidação da Arquitetura)

**Data:** 04 de Agosto de 2026
**Status:** Concluída

---

## Objetivo

Transformar a base da A2Sports360 em um **Engine Esportivo Multimodal** sólido, eliminando resquícios de hardcodes no banco de dados e padronizando a arquitetura dos serviços para qualquer modalidade esportiva.

---

## Entregas

### 1. Eliminação de Acesso Direto (`game_tables`)
Os acessos diretos à tabela `game_tables` nas rotas auditadas foram eliminados. Permanecem acessos diretos a outras tabelas no App Router, catalogados em `Dependency-Audit.md` para migração gradual.

Arquivos corrigidos:
- `src/app/public/table/[number]/page.tsx`
- `src/app/(dashboard)/championships/[id]/table/setup/page.tsx`
- `src/app/(dashboard)/championships/[id]/table/1/page.tsx`

### 2. Public APIs (`index.ts`)
Criados arquivos `index.ts` em todos os 6 domínios existentes, exportando apenas Service e Types. O Repository fica encapsulado e inacessível externamente.

Domínios:
- `championship/`, `integration/`, `match/`, `operation/`, `resolution/`, `resource/`

### 3. Documentos Constitucionais Criados
- `docs/01-architecture/Platform-Rules.md` — As 10 regras de ouro invioláveis.
- `docs/01-architecture/Domain-Boundaries.md` — Mapa de dependências entre Engines.
- `docs/01-architecture/Dependency-Audit.md` — Inventário classificado de violações legadas.
- `docs/09-roadmap/Architecture-Roadmap.md` — Esteira de Engines (✅ consolidados / ⬜ planejados).
- `docs/07-decisions/ADR-012-PlatformHardening.md` — Registro formal da decisão.
- `docs/02-guidelines/Developer-Onboarding.md` — Guia para novos desenvolvedores.
- `docs/02-guidelines/Maintenance-Guide.md` — Guia de manutenção.

### 4. Decisões Incorporadas
- `src/domains/championship` mantido (não renomeado para `competition`).
- Nenhum Engine vazio criado — serão construídos sob demanda.
- Repository Rule instituída como obrigatória para todo código novo.
- Migração do legado existente será gradual e acompanhada pela auditoria.

---

## Vigência da Repository Rule

A Repository Rule (Regra 1 de `Platform-Rules.md`) é:

1. **Obrigatória para todo código novo** a partir desta Sprint.
2. **Objetivo de migração gradual** para o legado existente, catalogado em `Dependency-Audit.md`.
3. **Não é uma afirmação de que todo código anterior já foi migrado.** As 9 ocorrências legadas restantes estão inventariadas, classificadas e priorizadas.

---

## Quality Gates

| Gate | Status |
|------|--------|
| `pnpm exec tsc --noEmit` | ✅ Passou |
| `pnpm exec eslint .` | ✅ Passou |
| `pnpm run build` | ✅ Passou |
