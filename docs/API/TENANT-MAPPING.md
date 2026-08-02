# Procedimento: Mapeamento de Tenants (Ticketera -> Sports)

Este documento detalha o processo para vincular o produtor da A2Tickets360 com o Tenant interno da A2Sports360.

O endpoint `/api/internal/tickets/create-championship` exige que o `tenant_external_id` (enviado pela Ticketera) já possua um mapeamento para um `tenant_id` válido no Sports. **A API não cria tenants automaticamente.**

## 1. Localizar o Produtor na Ticketera

1. Acesse o sistema da Ticketera.
2. Identifique o ID do produtor (ex: `PROD_8471`).

## 2. Localizar (ou Criar) o Tenant na Sports

1. Verifique se o organizador já tem um Tenant na A2Sports360.
2. Identifique o ID do Tenant no Supabase da Sports (ex: `e33b49f9-e4d5-45dc-b9b5-c41935678ab3`).

## 3. Inserir o Mapeamento

Utilize o script SQL parametrizado abaixo (pode ser executado no painel SQL Editor do Supabase) para realizar a vinculação segura:

```sql
-- Script Parametrizado para Criar Mapeamento de Tenant
DO $$
DECLARE
    v_source_system text := 'A2TICKETS';
    v_external_tenant_id text := 'COLOQUE_O_ID_DO_PRODUTOR_AQUI'; 
    v_tenant_id uuid := 'COLOQUE_O_ID_DO_TENANT_DA_SPORTS_AQUI';
BEGIN
    INSERT INTO public.tenant_mappings (
        tenant_id, 
        source_system, 
        external_tenant_id
    )
    VALUES (
        v_tenant_id,
        v_source_system,
        v_external_tenant_id
    )
    ON CONFLICT (source_system, external_tenant_id) 
    DO UPDATE SET 
        tenant_id = EXCLUDED.tenant_id,
        updated_at = now();
        
    RAISE NOTICE 'Mapeamento criado/atualizado com sucesso.';
END $$;
```

## Por que não existe endpoint de mapeamento automático?
O mapeamento automático representa um risco de segurança e poluição de banco de dados se a API for exposta. Um atacante poderia gerar milhares de Tenants inválidos na plataforma. O mapeamento explícito garante que apenas produtores validados e com contratos comerciais estabelecidos tenham acesso a provisionar campeonatos automaticamente.
