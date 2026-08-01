# Regras de Segurança e Service Role

**Data:** 01 de Agosto de 2026
**Contexto:** Endurecimento de Segurança (Fatia 1.1)

Como o schema público de dados do A2 Sports 360 foi configurado em modo restrito (Default Deny-All para operações anônimas nas tabelas transacionais), todas as integrações deverão seguir as diretrizes abaixo.

## 1. Uso Obrigatório da Service Role via Route Handlers
Como não temos políticas (RLS) concedendo acesso direto para as tabelas `match_sessions`, `players` ou gravação em `match_events`, essas tabelas serão manipuladas exclusivamente no servidor via `service_role`.

**Regra Absoluta:**
> A `service_role` **NUNCA** será usada sem validação de autorização estrita prévia.

Todo Route Handler que utilizar a `service_role` para rotas administrativas **deverá obrigatoriamente**:
1. **Autenticar o usuário:** Confirmar a identidade no Supabase Auth.
2. **Resolver profile e tenant_id:** Buscar os dados do organizador (Profile) e recuperar o respectivo `tenant_id`.
3. **Confirmar propriedade da entidade:** Garantir via consulta prévia (ou constraints lógicas) que a entidade alvo da operação (ex: Championship, Team, Game Table) pertence estritamente ao `tenant_id` do organizador logado.
4. **Executar a operação:** Somente após os 3 passos acima a operação privilegiada poderá ser executada.

## 2. Rotas Públicas (MVP)
Foi decidido que não haverá acesso de leitura pública (via SELECT anon) nas tabelas operacionais. Todas as leituras públicas (como o acesso via QR Code da mesa) devem acontecer Server-Side.

**Regras para a rota pública de mesa:**
1. **Validar `qr_token`:** A rota deve receber e validar a integridade do token do QR Code.
2. **Retornar apenas DTO Sanitizado:** A API deve formatar e retornar apenas um objeto seguro (Data Transfer Object).
   - **O que incluir:** nome público do campeonato, número da mesa, nomes públicos das equipes, placar, status e eventos públicos necessários.
   - **O que NÃO incluir (NUNCA):** `tenant_id`, IDs administrativos desnecessários (UUIDs internos que não servem para o frontend público), telefone, dados de profile, `session_token_hash` e outras informações de infraestrutura.
3. **Sem Mutações Abertas:** A leitura pública da mesa via QR Code **não** concede privilégio de gravação/mutação (nem diretamente, nem via API pública livre).
4. **Proteção de Match Session:** O registro de pontos no futuro (via API ou RPC) vai exigir uma `match_session` válida associada à mesa/partida.

## 3. Realtime Público (Fatia 5)
O Realtime para atualizações ao vivo da mesa no frontend (Fatia 5) será desenhado para utilizar canais restritos ou mecanismos que transmitam apenas os payloads equivalentes ao DTO sanitizado, assegurando que não abriremos leituras globais desnecessárias via subscrições abertas às tabelas na role `anon`. Detalhes técnicos serão definidos na Fatia 5.
