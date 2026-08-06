# Catálogo de RPCs

1. **`register_match_event`**: (Score Engine) Computa ponto atômico, avalia `target_score`. Afeta: `match_events`, `matches`.
2. **`undo_match_event`**: Cancela último evento não-desfeito.
3. **`dispatch_encounter_to_resource`**: (Operation Engine) Coloca o Encounter e Queda 1 na Mesa com bloqueio transacional FOR UPDATE.
4. **`generate_direct_match_tournament`**: (Tournament Engine) Gera Confronto e Times a partir dos tickets.
5. **`configure_championship_sports`**: (Competition Engine) Configura e salva rulesets.
6. **`resolve_finished_game`**: (Resolution Engine) Homologa uma Queda, soma vitórias do Encounter, decide se encerra o confronto e libera mesa ou cria próxima queda atrelada.
7. **`configure_championship_resources`**: (Resource Engine) RPC responsável por configurar as arenas (lote) com idempotência garantindo o não apagamento e prevenindo recriação duplicada do `display_order`.