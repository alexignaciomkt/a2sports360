# Glossário Oficial da Plataforma (Event-Driven)

Este documento centraliza a terminologia oficial e as definições canônicas utilizadas no código, na arquitetura e nas Sprints da A2Sports360.

### Terminologia Fundamental

**Command:** Uma intenção ou pedido para alterar o estado do sistema (ex: `DispatchEncounter`). Não é uma garantia de que o fato ocorreu.
**Event:** Um fato consumado, irreversível e imutável que ocorreu no domínio ou na quadra (ex: `MatchStarted`).
**State:** A fotografia atual dos dados (ex: placar atual, resource ocupado). O estado não relata o passado, apenas espelha o agora.
**Projection:** Qualquer representação visual ou derivada feita a partir da leitura dos Events ou State (ex: UI, Dashboard, Replay, BI, Display). Nenhuma Projection é fonte de verdade.
**Snapshot:** Uma fotografia consolidada em um instante no tempo enviada pelo Backend para o Frontend (ex: Snapshot Operacional do Dashboard), geralmente derivada de vários States combinados.

### Entidades do Domínio

**Resource:** A abstração universal de infraestrutura física de jogo. "Mesas", "Quadras", "Campos" ou "Tatamis" não existem como conceitos primários no backend.
**Encounter:** Um pareamento oficial (confronto) criado pelo *Tournament Engine*. Ele é quem entra na fila e possui regras de chaves.
**Match:** Uma partida isolada entre dois times, existindo primordialmente no contexto e regra esportiva, muitas vezes compondo uma "melhor-de-N" que resolverá um Encounter.
**Competition:** O Campeonato ou evento global esportivo configurado no nível do *Championship Engine*.
**Tournament:** O motor de torneio, que lida estritamente com chaveamento, bracket e fase de grupos.

### Motores (Engines)

**Operation:** O Orquestrador. Recebe Commands, aloca Resources, envia Encounters para a quadra, mas não entende de regras esportivas.
**Resolution:** O motor responsável pela homologação atômica e progresso (ex: quem ganha, avanço no bracket).
**Scheduling:** (Futuro) O motor responsável por orquestrar a fila de despacho, decidir prioridades, timeouts e WOs com base em políticas.
**Display:** (Futuro) Motor de projeção que desenha animações e placares em telões.
**Replay:** (Futuro) Motor de projeção que desenha uma timeline baseada em Eventos.
**Analytics:** (Futuro) BI, estatística profunda e saúde operacional derivada dos Eventos acumulados.
