# Architecture Roadmap (Evolução da Plataforma)

Este mapa descreve exclusivamente a evolução das *capacidades de domínio* e dos *Engines* estruturais da A2Sports360. Não deve incluir menções a páginas, modais, UI ou botões.

### Capacidades Consolidada (Done)
- ✅ **Integration Engine** (Webhooks, Tickets, Syncing)
- ✅ **Championship Engine** (Settings, Times)
- ✅ **Tournament Engine** (Confrontos e Brackets iniciais - *Atualmente embarcado no Championship*)
- ✅ **Resource Engine** (Universal Venue Management)
- ✅ **Match Engine** (Regras e Series)
- ✅ **Operation Engine** (Despacho Manual + Fila Automática V2, Snapshot Operacional, Controle por ResourceId V4)
- ✅ **Resolution Engine** (Homologação atômica)

### Caminho Evolutivo dos Motores (Engines Roadmap)
A arquitetura baseada em eventos flui de acordo com as seguintes responsabilidades:

```text
Competition Engine
↓
Tournament Engine
↓
Scheduling Engine
↓
Operation Engine
↓
Resource Engine
↓
Sport Event Engine
↓
Resolution Engine
↓
Projection Engines
```

### Projection Layer
As seguintes *Projections* (visões derivadas) são ou serão as consumidoras finais de todos os eventos:
- ├── Scoreboard
- ├── Dashboard
- ├── Display
- ├── Replay
- ├── Analytics
- ├── AI Commentary
- └── Timeline

### Capacidades Planejadas (To-Do)
- ⬜ **Validation Engine** (Homologação paralela, Contestação e Auditoria)
- ⬜ **Scheduling Engine** (Orquestração de políticas de fila, timeouts, walkover, prioridades)
- ⬜ **Automation Engine** (Despacho automático em fila, notificações WhatsApp, IA)
- ⬜ **Display Engine** (Painéis, Broadcasting, QR Codes Dinâmicos)
- ⬜ **Sport Event Engine** (Catálogo universal `SportEvent`, abandonando UI acoplada a placar absoluto)
- ⬜ **Analytics Engine** (Métricas de gargalo, tempo de fila, eficiência de Locais de Jogo)
