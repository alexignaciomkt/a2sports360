# ADR-015 — Event-Driven Architecture Foundation

**Data:** Agosto 2026
**Status:** Aceito (Sprint 15D)

**Contexto:**
À medida que a plataforma expande para modalidades variadas, a manutenção de um placar absoluto, atrelado a botões hardcoded, não escala. Existe a necessidade estrutural de padronizar a forma como as informações fluem entre a intenção do operador, o domínio esportivo e as dezenas de visualizações (Telão, Replay, BI).

**Decisão:**
A A2Sports360 passa oficialmente a adotar o padrão arquitetural Event-Driven, separando estritamente:
`Commands` (Intenções) -> `Events` (Fatos Esportivos) -> `Projections` (Vistas/Dashboards).

Fica estabelecido também que o conceito atual de `ScoreAction` no Score Engine é de caráter transitório. O destino final arquitetural para o registro da partida é o conceito centralizado de **`SportEvent`**.

**Consequências:**
- Nenhuma feature visual será desenhada considerando que ela "possui a verdade". Telas são apenas `Projections`.
- Operadores não "mudam o placar", eles disparam `Commands`.
- O sistema registra e orquestra uma fita contínua de `Events` (imutáveis), e o placar, a narração IA ou as estatísticas do BI são apenas leituras (`Projections`) dessa mesma fita.
- A plataforma assegura escalabilidade e resiliência contra complexidade de novas modalidades esportivas, centralizando o domínio em acontecimentos (`SportEvent`).
