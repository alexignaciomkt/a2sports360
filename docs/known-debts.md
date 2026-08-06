# Dívidas Técnicas Conhecidas

- Renomear tabela `game_tables` para `resources` ou `arenas` no momento em que as rotas legadas `/table/[number]` e o pareamento de QR Code legados forem inteiramente removidos ou migrados.
- Trocar `number` global da `game_tables` por uso estrito de ID + display_order nas rotas de fallback.
- **Histórico**: Na Sprint 13A, a migration inicial de arenas omitiu os defaults de timestamps para os inserts, mas isso foi fixado imediatamente pela corretiva `180700`. Se novos campos "técnicos" de controle forem adicionados no futuro, garantir sempre o estabelecimento dos seus defaults via PostgreSQL e não delegar essa lógica ao client de aplicação.