# Platform Rules (Constituição da Plataforma)

Este documento estabelece as **Regras de Ouro** invioláveis da arquitetura da A2Sports360. A plataforma deixou de ser apenas um sistema de gerenciamento de campeonatos e agora é oficialmente uma **Plataforma Operacional para Eventos Esportivos**.

A arquitetura sempre prevalece sobre a velocidade de implementação. Qualquer decisão futura deve preservar essa visão e proteger a separação entre Engines.

---

## 1. Arquitetura antes de código
Antes de implementar qualquer Sprint, execute obrigatoriamente:
- auditoria da arquitetura atual;
- identificação de impactos;
- identificação de riscos;
- verificação das ADRs existentes;
- compatibilidade retroativa;
- análise de alternativas mais simples.

Caso encontre uma arquitetura melhor, interrompa a implementação e apresente a proposta antes de escrever código.

## 2. Engines possuem fronteiras rígidas
A plataforma é composta por Engines independentes. Nenhum Engine pode assumir a responsabilidade de outro.
- **Tournament Engine**: cria confrontos.
- **Operation Engine**: agenda confrontos.
- **Resolution Engine**: encerra confrontos.
- **Resource Engine**: representa infraestrutura.
- **Scheduling Engine** *(Futuro)*: decidirá políticas.
- **Display Engine** *(Futuro)*: apresentará informações.
- **Analytics Engine** *(Futuro)*: analisará dados.
- **Automation Engine** *(Futuro)*: automatizará decisões.

## 3. Resource é a única abstração válida
Internamente, nunca utilize termos como `Mesa`, `Quadra`, `Campo`, `Tatame`, ou `Arena`. Esses termos pertencem exclusivamente à interface do usuário.
Internamente existe apenas: **Resource**. Toda lógica trabalha exclusivamente com `resource_id`, `display_name`, e `ResourceService`.

## 4. Repository Rule
Nenhum código fora dos Repositories pode acessar o Supabase diretamente.
É terminantemente proibido utilizar `supabase.from(...)` em Pages, Components, Services ou Actions. Somente Repositories acessam o banco de dados.

## 5. Commands
Toda alteração de estado acontece exclusivamente através de Commands e jamais por UPDATE direto nos Services.
Exemplos válidos: `dispatch_encounter_to_resource`, `process_dispatch_queue`, `resolve_finished_game`. Nenhuma nova Command poderá quebrar esse padrão.

## 6. Concorrência
Toda operação transacional seguirá rigorosamente a política oficial:
1. Lock do Championship (`FOR UPDATE`).
2. Locks específicos da operação.
3. Ordem determinística.
4. Idempotência.
5. Subtransações (`BEGIN...EXCEPTION...END`) quando houver processamento em lote.

Nunca alterar essa política sem uma nova ADR.

## 7. Lógica esportiva e Limites de Domínio
- *Operation* nunca conhece regras esportivas.
- *Resolution* nunca decide regras.
- *Resource* nunca decide confrontos.
- *Tournament* nunca controla infraestrutura.
Cada Engine permanece isolado e responsável apenas pelo seu próprio domínio.

## 8. Estados
Novos estados somente mediante justificativa arquitetural. Não crie estados apenas para resolver problemas pontuais. Toda alteração de máquina de estados deve gerar uma nova ADR.

## 9. Living Documentation
Nenhuma Sprint é considerada concluída sem a atualização imediata da documentação:
- Current-State
- Roadmap
- Architecture Roadmap
- Engine correspondente
- Sprint log
- ADR (quando necessário)

A documentação faz parte integrante da entrega.

## 10. Quality Gates
Nenhuma Sprint pode ser marcada como concluída sem aprovação integral nos seguintes testes:
```bash
pnpm exec supabase db push --dry-run
pnpm exec supabase db push
supabase gen types
pnpm exec tsc --noEmit
pnpm exec eslint .
pnpm run build
pnpm exec supabase migration list
```
Se qualquer etapa falhar, a Sprint permanece oficialmente: 🟡 **Em Validação**.
