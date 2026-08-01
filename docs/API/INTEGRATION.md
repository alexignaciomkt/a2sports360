# A2Sports360 - Integration API

Esta documentação define a interface privada de integração server-to-server para a plataforma A2Sports360.

## Autenticação

A API de integração é protegida via Chave de API Estática.

**Header Obrigatório**: `X-A2-API-KEY`

Caso a chave esteja incorreta ou ausente, a API retornará HTTP `401 Unauthorized`.

---

## 1. Criar Campeonato

Recebe o payload de um campeonato gerado em um sistema de origem e registra na Sports.

**Endpoint**: `POST /api/internal/tickets/create-championship`

### Mapeamento de Tenant (External Identity)

A A2Sports360 exige a combinação de `source_system` e `tenant_external_id` para resolver o tenant interno. Se o mapeamento não for encontrado, a API rejeitará a criação com código `TENANT_MAPPING_NOT_FOUND` (404). A plataforma não cria Tenants automaticamente neste fluxo.

### Idempotência e Unicidade

A combinação `(source_system, external_event_id)` é **ÚNICA**.
Se a API for acionada múltiplas vezes com o mesmo payload compatível, ela retornará `200 OK` (sucesso idempotente) e devolverá o ID já existente.
Caso haja divergência nos dados sensíveis, retornará `409 Conflict`.

### Payload

```json
{
  "source_system": "A2TICKETS",
  "external_event_id": "evt_123456",
  "tenant_external_id": "tnt_abc987",
  "organizer_external_id": "org_xyz",
  "organizer_name": "Nome do Organizador",
  "championship_name": "Copa Verão 2026",
  "modality": "truco_duplas",
  "format": "one_table_demo",
  "target_score": 12,
  "starts_at": "2026-10-01T10:00:00Z",
  "metadata": {}
}
```

### Respostas

**201 Created** (Criação de sucesso)
```json
{
  "success": true,
  "championship_id": "uuid-interno",
  "message": "Campeonato criado com sucesso.",
  "request_id": "req-uuid"
}
```

**200 OK** (Retry / Idempotência)
```json
{
  "success": true,
  "championship_id": "uuid-existente",
  "message": "Campeonato já existente retornado (Idempotência).",
  "request_id": "req-uuid"
}
```

**409 Conflict**
```json
{
  "success": false,
  "code": "EXTERNAL_EVENT_CONFLICT",
  "message": "Um campeonato já existe com esse identificador, mas com propriedades diferentes.",
  "request_id": "req-uuid"
}
```

**404 Not Found**
```json
{
  "success": false,
  "code": "TENANT_MAPPING_NOT_FOUND",
  "message": "O tenant não foi encontrado para as credenciais fornecidas.",
  "request_id": "req-uuid"
}
```

**400 Bad Request**
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Dados de entrada inválidos.",
  "issues": [...],
  "request_id": "req-uuid"
}
```

---

## 2. Registrar Equipe (Draft)

**Endpoint**: `POST /api/internal/tickets/register-team`

(Ainda não implementado, retorna sempre 501).
