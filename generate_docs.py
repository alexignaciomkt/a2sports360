import os

docs_structure = {
    "docs/README.md": "# A2Sports360\n\nSistema de gerenciamento e exibi\u00e7\u00e3o de campeonatos esportivos em tempo real, inicialmente focado em Truco em Duplas. Com a A2Sports360, seu campeonato vira um show.",
    "docs/PRD/00-MVP-IMPLEMENTACAO.md": "# MVP - Implementa\u00e7\u00e3o\n\nFoco no campeonato de truco, 2 duplas, 4 jogadores, 1 mesa, QR code fixo e placar digital com atualiza\u00e7\u00e3o em tempo real. Tel\u00e3o de exibi\u00e7\u00e3o inclu\u00eddo.",
    "docs/PRD/01-VISAO-DO-PRODUTO.md": "# Vis\u00e3o do Produto\n\nSlogan: \u201cCom a A2Sports360, seu campeonato vira um show.\u201d\nSistema respons\u00e1vel pelo gerenciamento do campeonato, equipes, partidas, e experi\u00eancia do evento. Diferente do A2Tickets360 que cuida do checkout e financeiro.",
    "docs/PRD/02-REGRAS-DE-NEGOCIO-MVP.md": "# Regras de Neg\u00f3cio do MVP\n\n- Truco em duplas.\n- 2 jogadores por equipe no MVP.\n- Mesa 1 possui QR Code permanente.\n- A final sempre ocorrer\u00e1 na Mesa 1.\n- Placar vai at\u00e9 12 pontos. Bot\u00f5es: 1, 3, 6, 9, 12, desfazer.",
    "docs/SFD/SFD-001-JORNADA-DO-ORGANIZADOR.md": "# Jornada do Organizador\n\nAutentica\u00e7\u00e3o b\u00e1sica, dashboard m\u00ednimo, cria\u00e7\u00e3o de campeonato, cadastro manual das duas equipes e jogadores, e encerramento do campeonato demonstrativo.",
    "docs/SFD/SFD-002-JORNADA-DA-MESA.md": "# Jornada da Mesa\n\nMesa 1 \u00e9 criada/gerada. QR Code permanente escaneado. Gera\u00e7\u00e3o de confronto, ativa\u00e7\u00e3o, abertura do placar. Hist\u00f3rico de eventos da partida.",
    "docs/ARCHITECTURE/00-VISAO-GERAL.md": "# Vis\u00e3o Geral\n\nStack Recomendada:\n- Next.js (App Router), React, TypeScript Strict, Tailwind CSS\n- Supabase JS, Auth, Realtime\n- PostgreSQL do Supabase\n- Vercel (Deploy)\n- Zod, React Hook Form",
    "docs/ARCHITECTURE/01-MODELO-DE-DADOS-PROPOSTO.md": "# Modelo de Dados Proposto\n\nEntidades principais:\n- tenants\n- profiles\n- championships\n- teams\n- players\n- team_players\n- tables\n- matches\n- match_events\n- match_sessions",
    "docs/ARCHITECTURE/02-REALTIME.md": "# Estrat\u00e9gia Realtime\n\nIsolamento por campeonato via canais `championship:<championship_id>` e `match:<match_id>`. Tel\u00e3o recebe apenas eventos do campeonato.",
    "docs/ARCHITECTURE/03-INTEGRACAO-A2TICKETS360.md": "# Integra\u00e7\u00e3o A2Tickets360\n\nContratos futuros documentados para `POST /api/integrations/a2tickets/events` e `POST /api/integrations/a2tickets/registrations`.",
    "docs/ARCHITECTURE/04-SEGURANCA-E-RLS.md": "# Seguran\u00e7a e RLS\n\nNenhuma credencial exposta. RLS aplicado nas tabelas com isolamento por `tenant_id` e `championship_id`. Nenhuma integra\u00e7\u00e3o Asaas no c\u00f3digo.",
    "docs/ADR/ADR-001-CAMPEONATO-COMO-CANAL-REALTIME.md": "# ADR 001 - Campeonato como Canal Realtime\n\nUtilizar\u00e1 canais dedicados por campeonato para evitar broadcast desnecess\u00e1rio de eventos.",
    "docs/ADR/ADR-002-MESA-POSSUI-QR-CODE-PERMANENTE.md": "# ADR 002 - Mesa Possui QR Code Permanente\n\nMesas ter\u00e3o tokens \u00fanicos de QR code fixos. A partida vinculada muda conforme o evento avan\u00e7a.",
    "docs/ADR/ADR-003-PLACAR-ORIENTADO-A-EVENTOS.md": "# ADR 003 - Placar Orientado a Eventos\n\nCada pontua\u00e7\u00e3o gera um evento (POINT_1, TRUCO_3, etc). Placar \u00e9 derivado/materializado dos eventos.",
    "docs/ADR/ADR-004-INTEGRACAO-DESACOPLADA-COM-A2TICKETS.md": "# ADR 004 - Integra\u00e7\u00e3o Desacoplada com A2Tickets\n\nComunica\u00e7\u00e3o via APIs e webhooks futuramente. Total independ\u00eancia das camadas de pagamento."
}

for path, content in docs_structure.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

print("Documentation structure generated successfully.")
