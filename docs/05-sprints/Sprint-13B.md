# Sprint 13B - Universal Venue Management

**Objetivo:** Consolidar definitivamente o Resource Engine como a camada genérica de infraestrutura física da A2Sports360, estabelecendo uma linguagem limpa ("Locais de Jogo") e eliminando acoplamentos de código atrelados a modalidades específicas (ex: "Mesa 1").

## Entregas

1. **Resource Type Catalog**
   - Criação do catálogo in-memory `src/domains/resource/resource-catalog.ts` isolando os ícones, nomes e cores de todos os `ResourceType` suportados (`COURT`, `FIELD`, `TABLE`, `MAT`, etc.).
   
2. **Nova UX: Locais de Jogo**
   - Padronização de todas as menções em tela para **Local / Locais de Jogo**, aposentando "Arenas" e "Mesas".
   
3. **Centro Operacional dos Locais**
   - Refatoração profunda na tela de gerenciamento (`arenas/page.tsx`).
   - Card de Adição Manual de locais via `ResourceService.createResource`.
   - Card de Geração Automática em Lote (com "Nome Base").
   - Card de Locais Operacionais renderizando o estado ao vivo (Livre / Ocupado) de cada infraestrutura configurada.

4. **Fim dos Hardcodes**
   - O `Operation Engine` e `Match Dispatch` deixaram de apontar estaticamente para `eq('number', 1)` (Mesa 1).
   - O Motor Operacional agora lê o(s) recurso(s) ativo(s) e exibe seus verdadeiros nomes (Ex: "Motor Operacional (Quadra Principal)").
   - O Telão Público (Public Scoreboard) abandonou `Mesa {number}` em prol de utilizar o `display_name` oficial.

## Impacto
A aplicação deu um passo enorme na adoção de múltiplas modalidades esportivas. A arquitetura está preparada para operar qualquer esporte físico, usando os Locais de Jogo de forma fluida sem requerer adaptações estruturais ou de banco de dados no futuro.
