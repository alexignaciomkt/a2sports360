# Migration Baseline & Histórico de Correção

**Data:** 01 de Agosto de 2026
**Contexto:** Fatia 1 (Endurecimento de Segurança e Ambiente)

## 1. Motivo da Divergência Encontrada
Durante o processo de validação da migration inicial do projeto (`20260801120000_init_schema.sql`), foi constatado que o banco de dados remoto hospedado no Supabase continha um histórico residual de migrações antigas de maio de 2026. Essas migrações não estavam presentes no repositório local atual, causando um conflito do tipo `LegacyDbPullMigrationConflictError` / `LegacyDbPushMissingLocalError` ao rodar o comando de `db push --dry-run`. 
Como o repositório reflete uma nova estruturação (limpa), a tentativa de aplicar a migração inicial falhou devido ao conflito do registro do histórico remoto versus o repositório local vazio.

## 2. Versões Reparadas
As seguintes versões antigas registradas na tabela `supabase_migrations.schema_migrations` do banco remoto foram marcadas como revertidas para sincronizar o estado e permitir que o novo esquema fosse aplicado com segurança:
- `20260503140100`
- `20260507161005`
- `20260508215613`
- `20260508215859`

## 3. Comandos Executados
Para restaurar a consistência do histórico da migração **sem destruir os recursos ou dados existentes de tabelas utilitárias**, o comando abaixo foi utilizado, alterando apenas a tabela de controle de migração:
```bash
supabase migration repair --status reverted 20260503140100 20260507161005 20260508215613 20260508215859
```

## 4. Migration Baseline Atual
O histórico de migrações consolidado atualizado começa oficialmente com:
1. `20260801120000_init_schema.sql` (Criação da estrutura de domínio do A2 Sports 360).
2. `20260801130000_harden_security.sql` (Revisão de policies anon e revogação do EXECUTE público da função de RPC mock).

Resultado do comando `supabase migration list --linked`:
```json
{
  "migrations": [
    { "local": "20260801120000", "remote": "20260801120000", "time": "2026-08-01 12:00:00" },
    { "local": "20260801130000", "remote": "20260801130000", "time": "2026-08-01 13:00:00" }
  ],
  "message": "Migrations listed"
}
```

**O comando de validação do Supabase garante que o schema atual seja a fonte da verdade para a continuação do projeto.**

## 5. Regra de Imutabilidade
**A partir deste ponto, está estritamente proibida qualquer alteração manual via interface SQL externa (Dashboard do Supabase) que modifique a estrutura do schema public.**
Toda e qualquer alteração de estrutura, RLS, functions, constraints e roles **deve** ser criada através de um arquivo de migração versionado no diretório `supabase/migrations/` (via comando `supabase migration new <nome>`) e empurrada utilizando `supabase db push`.
