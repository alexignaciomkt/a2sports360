# Legacy Compatibility
**Problema**: Código antigo quebrava com a refatoração.
**Decisão**: `register_match_event` libera mesa se `encounter_id` for null.