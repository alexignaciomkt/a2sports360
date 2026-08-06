# ADR 012: Platform Hardening & Constitution

**Data:** 04 de Agosto de 2026
**Status:** Aceito

## Contexto
O crescimento rápido da A2Sports360 e a inclusão do motor multiesportes (Sprint 13B) demonstraram que a base estava tendendo ao acúmulo de funcionalidades ao invés de aumentar as *capacidades intrínsecas da plataforma*. Interfaces acessavam o banco diretamente, existiam importações cruzadas entre repositórios e serviços de domínio sem restrições (expondo as lógicas internas) e não havia um manual definitivo barrando anti-patterns.

## Decisão
Foi decretado o "Platform Hardening", congelando regras estritas e fundando a **Constituição da Plataforma**.

1. **Domain Boundaries**: Foi mapeado e proibido ciclos de dependência ou acesso direto (Engine `A` não acessa Repositório `B` diretamente; acessa Service `B`). Veja `Domain-Boundaries.md`.
2. **Repository Rule**: Fica abolida a manipulação de `supabase.from()` ou chamadas de `.rpc()` em Frontend ou Services **para todo código novo**. Todo o tráfego com o banco será engarrafado unicamente nos `Repositories`. O código legado que ainda viola esta regra foi inventariado em `Dependency-Audit.md` e será migrado gradualmente.
3. **Public APIs**: Toda camada de Domínio passa a possuir um `index.ts` que exporta **somente** os Types e o Service. O Repository foi encapsulado.
4. **Platform Rules**: Foram estabelecidas as 10 regras de ouro no documento `Platform-Rules.md`.
5. **Evolução baseada em Capabilities**: A partir da consolidação do `Architecture-Roadmap.md`, toda Sprint será concebida para aumentar a musculatura e o escopo de um Engine da plataforma (Match, Operation, Resolution, Resource, Display, Automation, Validation) - jamais apenas "telas isoladas" desconectadas de um motor.

## Consequências
- **Positivas:** Redução exponencial de dívida técnica e acoplamento em cascata; garantia de robustez na modelagem multiesportiva (permitindo injetar qualquer módulo novo de arbitragem ou telão de pontuação sem reescrever o motor de operação). Escalabilidade do time de Devs via onboarding focado na *Constituição*.
- **Negativas:** Exige forte policiamento via Code Reviews para rechaçar PRs que criem bypass de Repository ou façam chamadas a banco via `.from` em components React. A migração do legado existente demandará esforço contínuo por várias Sprints.
