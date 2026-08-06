# ADR-014 — Evolução do ScoreAction para SportEvent Catalog

**Data:** Agosto 2026
**Status:** Aceito (Proposto na Sprint 15C)

**Contexto:**
Durante a refatoração semântica do `ScoreboardClient` na Sprint 15C, o componente passou de um controlador de placar absoluto para um executor de eventos configuráveis (via array `ScoreAction`). Entretanto, `ScoreAction` ainda é uma entidade voltada primariamente para a Interface de Usuário (UI). Foi constatado que existe uma lacuna arquitetural: a diferença fundamental entre **a ação do operador** e o **evento esportivo no mundo real**.

Em modalidades variadas, ações idênticas geram eventos com naturezas totalmente distintas. Por exemplo, na Sinuca uma "Bola Vermelha" confere `+1`, no Futebol um "Gol" confere `+1`, e no Tênis de Mesa um "Ponto" confere `+1`. O delta (`+1`) é apenas a consequência, enquanto o protagonista para a plataforma (para BI, Replay, Estatística, IA e Display Engine) deve ser o **Evento Esportivo (SportEvent)**.

**Decisão:**
Fica definido que a estrutura atual (`ScoreAction`) atuará como um modelo transicional. A plataforma evoluirá obrigatoriamente para um modelo baseado num **Catálogo Universal de Eventos Esportivos (`SportEvent`)**. 

O novo catálogo substituirá a visão UI-centric para um modelo rico, capaz de abrigar qualquer acontecimento que ocorra em uma partida:
- Eventos de pontuação (Score)
- Penalidades (Penalty, ex: Cartões)
- Interrupções e Tempo (Timeout, Medical, Acréscimos)
- Substituições (Substitution)

O `Operation Engine` orquestrará a emissão destes acontecimentos puros e atômicos. O registro transacional via RPC deixará de registrar apenas `points_delta` para carregar a semântica integral do evento (`analyticsKey`, `category`, etc.). 

**Consequências e Benefícios:**
- **Replay Enriquecido:** Históricos deixarão de listar apenas deltas matemáticos para contar a narrativa real do jogo (ex: `🔥 TRUCO (+3)` ou `⚽ GOL (+1)`).
- **IA Narradora Natural:** Modelos de Linguagem não precisarão interpretar cálculos numéricos, traduzindo as chaves diretamente em locução (ex: `"analyticsKey: truco"` -> *"The Kings venceram um Truco."*).
- **Desacoplamento Completo:** A UI de operações não conhecerá Truco, Sinuca ou Futebol; ela será um mero painel que renderiza `SportEvents` habilitados para aquela modalidade e injeta-os no banco.
- **Vantagem Competitiva:** Ao tratar o placar como uma mera consequência do Event Sourcing (sendo apenas uma das projeções dos eventos acumulados), a A2Sports360 consolida um banco de dados estatístico maduro, impossível de ser obtido em sistemas tradicionais de bracket e chaves simples.
