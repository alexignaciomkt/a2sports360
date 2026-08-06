# Domain Boundaries

Este documento mapeia o fluxo de dependências e responsabilidades entre os Engines da A2Sports360. A quebra destes limites gera acoplamento indevido e dívida técnica.

## Fluxo de Dependência Unidirecional

### Resource Engine
- **Responsabilidade**: Abstrair e expor a infraestrutura física polimórfica (Locais de Jogo).
- **Dependências Externas**: Não conhece nenhum outro Engine.
- **Utilizado por**: Operation, Resolution.

### Match Engine
- **Responsabilidade**: Regras de confronto, pontuação de vitórias/séries, estrutura do jogo esportivo.
- **Dependências Externas**: Não conhece Display, Operation ou Resolution.
- **Utilizado por**: Resolution, Operation, Championship.

### Resolution Engine
- **Responsabilidade**: Homologar e encerrar quedas (games) de forma segura.
- **Dependências Externas**: 
  - Pode utilizar o **Match Engine** para validar pontuações.
  - Pode utilizar o **Resource Engine** para desocupar ou sinalizar os Locais de Jogo envolvidos.

### Operation Engine
- **Responsabilidade**: Orquestrar a utilização operacional da infraestrutura física do campeonato. Despacho manual (unitário) e automático (fila em lote). Decidir quando, onde e em qual ordem os confrontos acontecem.
- **Dependências Externas**:
  - Pode utilizar o **Resource Engine** para consultar disponibilidade de Locais de Jogo.
  - Pode utilizar o **Championship Engine** para checar configurações e equipes.
- **Não conhece**: regras esportivas, pontuação, resolução de quedas.

### Integration Engine
- **Responsabilidade**: Fronteira com o mundo exterior (A2Tickets, gateways, webhooks).
- **Dependências Externas**: 
  - Utiliza o **Championship Engine** para persistir times e gerar campeonatos recebidos via webhook.

### Championship Engine
- **Responsabilidade**: Estruturação macro da competição (definições, times, chaves, fase de grupos).
- **Dependências Externas**: 
  - Não conhece Resource, Resolution, Integration.

## Regra Base
Se o Engine `A` conhece o Engine `B` e o Engine `B` conhece o Engine `A`, há uma dependência circular estrutural. Um dos domínios deve ser extraído ou subordinado. Sempre interaja através dos **Services** (Public APIs delimitadas nos *indexes* de cada domínio), jamais acesse o *Repository* alheio.
