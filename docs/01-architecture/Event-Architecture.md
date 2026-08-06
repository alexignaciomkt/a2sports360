# Event-Driven Architecture (Constituição do Modelo de Eventos)

A arquitetura da A2Sports360 é fundamentalmente orientada a eventos. A plataforma adota uma separação estrita entre **Intenção** (Command), **Fato** (Event), **Estado Atual** (State) e **Visão** (Projection).

## 1. Commands
Representam a **intenção** ou solicitação de uma mudança no sistema. Commands não representam fatos consumados; eles podem ser validados, negados ou enfileirados.
- **Exemplos:** `DispatchEncounter`, `RegisterMatchEvent`, `UndoMatchEvent`, `ResolveMatch`, `TakeOverControlSession`, `GenerateTournament`.
- **Regra de Ouro:** Commands nunca representam a história ou a verdade absoluta, apenas pedem que ela aconteça.

## 2. Events
Representam **fatos consumados** que ocorreram no esporte ou no sistema.
- **Exemplos:** `MatchStarted`, `PointRegistered`, `TrucoWon`, `SixWon`, `TimeoutCalled`, `YellowCardIssued`, `MedicalPauseStarted`, `MatchFinished`, `ResourceBlocked`.
- **Regra de Ouro:** Events são completamente imutáveis. O passado nunca é alterado ou reescrito, apenas suplementado por novos eventos.

## 3. State
Representa a **fotografia atual** de uma entidade do domínio.
- **Exemplos:** `Match`, `Encounter`, `Resource`, `Championship`, `Session`.
- **Regra de Ouro:** O State nunca explica a história de como se chegou àquela situação. Ele apenas documenta o "presente".

## 4. Projections
Representam **derivações** ou "leituras otimizadas" dos eventos e estados para apresentar informação.
- **Exemplos:** Scoreboard, Operational Dashboard, Display (Telão), Timeline, Replay, BI, Statistics, Public API.
- **Regra de Ouro:** Nenhuma Projection é fonte da verdade. Elas são apenas consumidores do catálogo de eventos ou do estado atual.
