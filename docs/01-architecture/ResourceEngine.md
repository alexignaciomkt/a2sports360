# Resource Engine
**Status**: Consolidado - Universal Venue Management (Sprint 13B), Identidade por ResourceId (Sprint 15A)
**Responsabilidade**: Modelar, prover e persistir a infraestrutura física dos eventos através da entidade universal `Resource`.
**UX / Interface**: Todo recurso gerido por este Engine é invariavelmente apresentado na interface da plataforma como um **Local de Jogo** (ou Local). Nomes fixos como "Mesa", "Quadra" ou "Arena" são banidos da UI, ficando restritos às nomenclaturas base que os organizadores escolhem durante o cadastro.
**Identidade Operacional (Sprint 15A)**: A identidade operacional do Local é exclusivamente o `resourceId`. `display_name` é apresentação e nunca identidade. `number` é compatibilidade legada. Toda rota, link e Server Action deve usar `resource.id` para identificar o Local.
**O que NÃO conhece**: Como os confrontos são gerados (Tournament Engine) ou como são despachados automaticamente para as filas (Scheduling Engine / Dispatch).
**Eventos Próprios**: Resources não são apenas entidades passivas, eles geram seus próprios fatos no sistema.
Exemplos de eventos gerados:
- `ResourceBlocked`
- `ResourceReleased`
- `ResourceOccupied`
- `ResourceMaintenanceStarted`
**Tabela**: `game_tables` (nome físico legado).
**Catálogo**: A definição do leque esportivo de *ResourceTypes* suportado fica no `src/domains/resource/resource-catalog.ts`, mapeando ícones, cores e terminologias para uso pelas camadas superiores.