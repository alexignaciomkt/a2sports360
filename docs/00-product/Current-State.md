# Estado Atual do Produto

**Última Atualização:** Sprint 15A (Controle Operacional por ResourceId — Em Validação Funcional)

Atualmente a A2Sports360 possui a seguinte fundação:
- **Tenant & Autenticação**: Multi-tenant funcional com `tenant_mappings`.
- **Competições**: Recebe tickets da A2Tickets (via Webhook) e gera competições e times.
- **Configuração Esportiva**: (Sprint 08) Motor de regras via `championship_settings`.
- **Tournament Engine**: (Sprint 09) `encounters` (Confrontos) estão substituindo matches avulsos. O sistema entende melhor-de-N.
- **Resource Engine**: (Sprint 10) Mesas recebem Confrontos (`current_encounter_id`), não partidas soltas.
- **Match Engine**: Construído para avaliar regras de série e vitórias.
- **Resource Engine**: Expandido para infraestrutura física polimórfica (Quadras, Campos, Mesas) com criação em lote e Multi-tenant, com o devido tratamento de timestamps padrão no banco (Bugfix 13A). Consolidado via **Catálogo de Tipos** e UI agnóstica de modalidade.
- **Operation Engine V2**: (Sprint 14) Despacho automático em lote via `process_dispatch_queue`. (Sprint 14C) Operation Session Engine implementado para ciclo de vida seguro de autoridade no controle de placar. (Sprint 15) Dashboard Operacional entregue como painel central para controle de fluxo e monitoramento (polling inteligente, sem realtime por enquanto).
- **Resolution Engine**: Implementado para homologar resultados de maneira atômica e progredir Quedas na mesa.
- **Score Engine**: Funcional em tempo real para Truco (RPCs register/undo match_event). A partir da Sprint 15C, utiliza um **Catálogo de Eventos Oficial** (`ScoreAction`) injetável na UI. A interface visual age apenas como orquestradora desses eventos configuráveis (`points_delta`, `analyticsKey`), dissociando regras da UI para prover extensibilidade a BI, Replay, Display Engine e IA narradora.

**Regra Arquitetural (Sprint 15A):**
> A identidade operacional do Local é exclusivamente o `resourceId`. `display_name` é apresentação e nunca identidade. `number` é compatibilidade legada.

**Status do Frontend**:
- Journey (Jornada da competição) possui atalho para a "Central de Operações".
- Dashboard Operacional permite visão 360º de Locais de Jogo, Despachos Manuais e Processamento de Fila.
- Dashboard dos Locais configurável via interface operacional em Lote e Manual.
- Setup de Local e Public Scoreboard operacionais com os nomes customizados de cada infraestrutura.
- Controle de Placar (Sprint 14B) refinado visualmente e arquiteturalmente fixado com autoridade em cookie/hash seguro (Sprint 14C).
- **Controle Operacional (Sprint 15A):** Rota canônica `/championships/[id]/resources/[resourceId]/control`. Rotas legadas `/table/1` e `/table/setup` são redirects server-side. Server Actions validam user/tenant/championship/resource/match/sessão. `matchId` resolvido server-side.

**Status da Arquitetura (Platform Hardening)**:
- Consolidado o padrão `Domain Boundaries` e `Platform Rules` (Repository restrito, Services expostos).
- Os acessos diretos à tabela `game_tables` nas rotas auditadas foram eliminados. Permanecem acessos diretos a outras tabelas no App Router, catalogados em `Dependency-Audit.md` para migração gradual.
- A Repository Rule é obrigatória para todo código novo. A migração do legado existente será gradual e acompanhada pela auditoria.
- Display público (`/public/table/[number]`) mantido como rota legada temporária. QR permanente futuro usará `/r/[resourceId]`.

