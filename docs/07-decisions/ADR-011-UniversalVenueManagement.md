# ADR 011: Universal Venue Management (Locais de Jogo)

**Data:** 04 de Agosto de 2026
**Status:** Aceito

## Contexto
O campeonato exige infraestrutura física para as partidas acontecerem. Anteriormente, a aplicação utilizava `game_tables` no banco de dados e exibia hardcodes como "Mesa 1", "Arenas" e "Mesas" em toda a interface. Isso limitava severamente a natureza multiesportiva da A2Sports360, tornando o sistema conceitualmente engessado a esportes de mesa (Truco, Sinuca). 

Precisávamos garantir que a plataforma pudesse operar perfeitamente para Vôlei (Quadras), Futebol (Campos), Judô (Tatames), eSports (Estações) ou qualquer outra modalidade sem demandar novas migrations e refatorações destrutivas a cada novo esporte.

## Decisão
Foi decidido abstrair permanentemente a infraestrutura física separando a terminologia técnica (o Domínio) da Experiência do Usuário (UX):

1. **Domínio Técnico (Backend/Arquitetura)**:
   - A entidade foi batizada como `Resource` (representado pela tabela legada `game_tables`).
   - O `ResourceEngine` administra o ciclo de vida dessa infraestrutura independente de esporte.
   
2. **Experiência do Usuário (Frontend/UI)**:
   - Todas as representações visuais na plataforma adotam o termo universal e agnóstico **Local de Jogo** (ou **Locais**).
   - "Mesas" e "Arenas" foram varridas da comunicação padrão.

3. **Resource Type Catalog**:
   - Um catálogo em código (`src/domains/resource/resource-catalog.ts`) atua como única fonte de verdade (`TABLE`, `COURT`, `FIELD`, `MAT`, etc.) contendo metadados (cor, ícone, tradução) sem inflar o banco de dados desnecessariamente nesta fase.

4. **Fim da Era "Mesa 1"**:
   - É expressamente **proibido** utilizar `eq('number', 1)` ou strings hardcoded como "Mesa 1" para orientar fluxos de operação.
   - Qualquer operação (como o Operation Engine Dashboard ou Despacho de Confrontos) deve utilizar o `resource_id` e exibir na tela o `display_name` do Local de Jogo.

## Consequências
- **Positivas:** A A2Sports360 torna-se imediatamente escalável para dezenas de esportes com zero esforço de banco de dados. Os organizadores ganham liberdade absoluta de nomear seus locais de competição de forma personalizada através de cadastros em lote ou manuais (ex: "Quadra Principal", "Mesa TV").
- **Negativas:** Exigirá rigor da equipe de desenvolvimento para não usar "Mesa 1" em lógicas operacionais de futuros esportes adicionados, seguindo estritamente a API do `ResourceService`.
