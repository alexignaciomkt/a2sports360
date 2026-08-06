# Developer Onboarding Guide

Bem-vindo à equipe da A2Sports360. Para começar a desenvolver na plataforma, você precisa compreender as nossas regras de arquitetura e funcionamento dos Engines.

## A Arquitetura em Motores (Engines)
A aplicação evolui através do fortalecimento das capacidades contínuas (Engines), e não por features isoladas.

- Leia a [Constituição da Plataforma](../01-architecture/Platform-Rules.md).
- Entenda os limites de domínio em [Domain Boundaries](../01-architecture/Domain-Boundaries.md).

## Ambiente de Desenvolvimento
1. Certifique-se de possuir o banco de dados rodando (Supabase local ou remoto) com as *migrations* atualizadas.
2. Todo pacote é resolvido via `pnpm`. Instale as dependências com `pnpm install`.
3. Inicie o servidor via `pnpm run dev`.

## Como submeter código
1. Nunca crie queries em componentes (App Router). Utilize a *Public API* do Engine (seu Service).
2. Valide as tipagens com `pnpm exec tsc --noEmit`.
3. Valide a conformidade com `pnpm exec eslint .`.
4. Confira o build local via `pnpm run build` antes de submeter um Pull Request.
5. Em caso de mudanças arquiteturais ou comportamentais permanentes, atualize ou crie um ADR (Architecture Decision Record).
