# Integração A2Tickets360 -> A2Sports360

Esta documentação descreve o contrato oficial para a criação de campeonatos no A2Sports360 a partir do A2Tickets360.

## Endpoint

`POST /api/internal/tickets/create-championship`

## Autenticação

A autenticação é feita via API Key, utilizando comparação de tempo constante para segurança contra *timing attacks*.
A chave deve ser enviada nos Headers.

* **Header:** `X-A2-API-KEY`
* **Tipo:** String

*Nota de Segurança: Nunca exponha a chave ao frontend ou registre em logs.*

## Payload

O Content-Type deve ser obrigatoriamente `application/json`.

```json
{
  "source_system": "A2TICKETS",
  "external_event_id": "ID_DO_EVENTO_NO_TICKETS",
  "tenant_external_id": "ID_DO_PRODUTOR_NO_TICKETS",
  "organizer_external_id": "ID_DO_ORGANIZADOR",
  "organizer_name": "Nome do Organizador",
  "championship_name": "Nome do Campeonato",
  "modality": "truco_duplas",
  "format": "one_table_demo",
  "target_score": 12,
  "starts_at": "2026-08-02T12:00:00Z",
  "metadata": {
    "version": "1.0",
    "source": "A2TICKETS"
  }
}
```

### Campos
- `source_system`: Obrigatório. Deve ser `"A2TICKETS"`.
- `external_event_id`: Obrigatório. Identificador único do evento no sistema de origem.
- `tenant_external_id`: Obrigatório. ID do produtor que será mapeado para o tenant da Sports.
- `organizer_external_id`: Obrigatório. ID do organizador (salvo no metadata).
- `organizer_name`: Obrigatório. Nome do organizador.
- `championship_name`: Obrigatório. Nome que será exibido no campeonato.
- `modality`: Obrigatório. Modalidade (ex: `"truco_duplas"`).
- `format`: Obrigatório. Formato do torneio.
- `target_score`: Obrigatório. Pontuação alvo (inteiro positivo).
- `starts_at`: Opcional. Data de início no formato ISO-8601.
- `metadata`: Opcional. Objeto JSON de até 10KB.

## Retornos e Códigos de Erro

A API utiliza códigos HTTP padronizados e retorna respostas em formato JSON contendo `code` e `message`.

- **201 Created**: Campeonato criado com sucesso.
  ```json
  { "championship_id": "uuid", "status": "draft", "created": true }
  ```
- **200 OK (Idempotente)**: Campeonato já existia e o payload era compatível.
  ```json
  { "success": true, "created": false, "already_exists": true, "championship_id": "uuid", "status": "draft", "request_id": "uuid" }
  ```
- **401 Unauthorized**: API Key inválida ou ausente.
  ```json
  { "success": false, "code": "UNAUTHORIZED", "message": "Credenciais inválidas.", "request_id": "uuid" }
  ```
- **404 Not Found**: Tenant não mapeado na Sports.
  ```json
  { "success": false, "code": "TENANT_MAPPING_NOT_FOUND", "message": "O organizador ainda não está vinculado à A2Sports360.", "request_id": "uuid" }
  ```
- **409 Conflict**: Identificador externo já cadastrado com parâmetros incompatíveis.
  ```json
  { "success": false, "code": "EXTERNAL_EVENT_CONFLICT", "message": "O identificador externo já está vinculado a outro campeonato.", "request_id": "uuid" }
  ```
- **422 Unprocessable Entity**: Payload inválido (falta de campos, tipos incorretos).
- **500 Internal Server Error**: Erro inesperado.

## Idempotência e Concorrência

A API foi projetada para lidar com concorrência usando a restrição (constraint) no banco de dados `UNIQUE(source_system, external_event_id)`.
Caso duas requisições cheguem simultaneamente:
1. Apenas uma conseguirá criar a linha (retornando 201).
2. A outra gerará um erro no banco (código PostgreSQL 23505).
3. A API captura o erro, busca o registro persistido, e avalia se os dados coincidem (`tenant_id, name, modality, format, target_score`).
4. Se sim, devolve `200` com `already_exists=true`. Se não, devolve `409 Conflict`.

## Exemplo cURL

```bash
curl -X POST https://api.a2sports360.com/api/internal/tickets/create-championship \
  -H "Content-Type: application/json" \
  -H "X-A2-API-KEY: sua_api_key_aqui" \
  -d '{
    "source_system": "A2TICKETS",
    "external_event_id": "EVT_12345",
    "tenant_external_id": "PROD_987",
    "organizer_external_id": "ORG_456",
    "organizer_name": "Clube de Truco",
    "championship_name": "Torneio de Inverno",
    "modality": "truco_duplas",
    "format": "one_table_demo",
    "target_score": 12
  }'
```
