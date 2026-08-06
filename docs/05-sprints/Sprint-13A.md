# Sprint 13A - Resource Infrastructure V2
**Objetivo**: Preparar e configurar os recursos físicos reais do campeonato (Arenas), introduzindo suporte para criação em lote de qualquer modalidade.
**Decisões Tomadas**:
1. `game_tables` foi mantida como nome legado da tabela para não quebrar compatibilidade, mas estendida com `tenant_id`, `resource_type`, `display_name`, `display_order`, `prefix_group`.
2. Adicionado Multi-Tenant RLS limpo baseada na `profiles`.
3. Criada a RPC atômica `configure_championship_resources` idempotente e robusta contra duplicação de prefixos e race conditions (locks no championship).
4. Configuração das arenas desbloqueia o resto da jornada operacional, desassociando de chumbamentos em "Mesa 1".
5. Bugfix (Timestamps Defaults): A migration original exigiu created_at e updated_at NOT NULL mas sem DEFAULT, espalhando a responsabilidade para o Client. Foi criada a corretiva `180700` restaurando o modelo `DEFAULT now()`.
6. Bugfix (QR Token Generation): O uso de `gen_random_bytes(16)` gerou erro de dependência do `pgcrypto`. Foi substituído pelo uso puro de `gen_random_uuid()` sem hífens para preservar o padrão oficial de Node.js `randomBytes(16).toString("hex")` sem introduzir dependências extras no banco.
**Migrations**: 
- `20260804154600_sprint_13a_arena_infrastructure.sql`
- `20260804180700_sprint_13a_resource_timestamp_defaults.sql`
- `20260804183300_sprint_13a_qr_token_fix.sql`
**RPCs**: configure_championship_resources