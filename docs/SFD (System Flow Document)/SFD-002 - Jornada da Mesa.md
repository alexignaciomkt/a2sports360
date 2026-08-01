SFD-002 - Jornada da Mesa.md

Versão: 1.1
Status: Em Desenvolvimento

Objetivo

Descrever o ciclo de vida completo de uma mesa durante um campeonato.

A mesa será responsável por hospedar uma partida, registrar os eventos do jogo em tempo real, alimentar o telão, atualizar as estatísticas do campeonato e, ao final, retornar automaticamente ao estado de disponível para receber um novo confronto.

Conceito
Mesa Física

A mesa representa um recurso físico do campeonato.

Cada mesa possui:

Número identificador
QR Code permanente
Status operacional

O QR Code nunca muda.

O que muda é a partida vinculada àquela mesa.

Estados da Mesa
Disponível

↓

Aguardando Equipes

↓

Partida Iniciada

↓

Partida Finalizada

↓

Disponível
Consolidação Automática das Mesas

À medida que o campeonato avança e o número de partidas diminui, o sistema deverá reutilizar prioritariamente as mesas de menor numeração.

Exemplo:

Primeira Rodada
Mesa 01
Mesa 02
Mesa 03
...
Mesa 32
Quartas de Final
Mesa 01
Mesa 02
Mesa 03
Mesa 04
Semifinal
Mesa 01
Mesa 02
Final
Mesa 01
Objetivos
concentrar o público;
facilitar transmissões;
melhorar a organização;
transformar a Mesa 1 no palco principal do campeonato.
Fluxo Operacional
ETAPA 1 — Geração da Rodada

Ao gerar uma nova rodada, o sistema deverá automaticamente:

selecionar as equipes;
gerar os confrontos;
atribuir as mesas;
atualizar o telão;
habilitar as mesas envolvidas.
ETAPA 2 — Chegada das Equipes

Os jogadores consultam o telão e identificam:

número da mesa;
adversários.

Ao chegar na mesa, qualquer participante poderá ler o QR Code.

ETAPA 3 — Leitura do QR Code

O QR Code identifica exclusivamente a mesa.

Após a leitura, o sistema verifica:

existe partida ativa?
existe confronto atribuído?

Caso positivo, abre automaticamente o Painel da Partida.

Painel da Partida

O painel exibirá exclusivamente informações da partida atual.

Informações
Mesa
Equipe A
Equipe B
Placar
Tempo de partida
Controles do Placar

O placar será registrado através dos botões oficiais da modalidade.

Botões disponíveis
+1
+3 (Truco Aceito)
+6 (Seis Aceito)
+9 (Nove Aceito)
+12 (Doze Aceito)

Também haverá:

Desfazer Última Jogada
Arquitetura de Eventos

Cada clique em um botão não adiciona apenas pontos.

Ele gera um evento da partida.

Exemplo:

Evento

↓

Tipo: Truco Aceito

↓

Valor: +3

↓

Mesa 08

↓

Horário

↓

Equipe responsável

O sistema calcula automaticamente o placar acumulado.

Atualizações em Tempo Real

Cada evento deverá atualizar automaticamente:

placar da partida;
Painel Operacional;
Telão;
estatísticas do campeonato;
histórico da partida.

Sem necessidade de atualização manual.

Encerramento da Partida

Ao atingir a pontuação definida pelo regulamento, o sistema solicitará confirmação da vitória.

Após confirmação:

encerra a partida;
registra o vencedor;
registra o perdedor;
atualiza a chave;
atualiza o telão;
atualiza estatísticas;
verifica repescagem;
envia notificações automáticas;
libera a mesa.
Liberação da Mesa

Após o encerramento da partida, a mesa retorna automaticamente ao estado:

Disponível

Caso existam novos confrontos aguardando mesa, o sistema poderá reutilizar automaticamente aquela mesa.

Situações Especiais
WO

O organizador poderá declarar WO diretamente pelo Painel Operacional.

Neste caso:

a partida é encerrada;
a mesa permanece disponível;
a chave é atualizada.
Cancelamento

Caso o confronto seja cancelado antes do início da partida:

nenhuma estatística será registrada;
a mesa retorna imediatamente ao estado Disponível.
Eventos do Telão

O telão deverá reagir automaticamente aos eventos registrados durante a partida.

Exemplos:

🔥 TRUCO!

Mesa 04
⚡ SEIS!

Mesa 12
🚀 NOVE!

Mesa 07
💥 DOZE!!!

Mesa 01
🏁 PARTIDA FINALIZADA

Mesa 08

Os efeitos visuais e animações serão definidos posteriormente, mas a arquitetura deverá permitir esse comportamento desde a primeira versão.

Histórico da Partida

Cada partida possuirá uma linha do tempo contendo todos os eventos registrados.

Exemplo:

10:12  +1  Equipe A

10:14  +3  Equipe B

10:18  +6  Equipe A

10:24  +1  Equipe A

10:27  Vitória Equipe A

Esse histórico servirá como base para:

auditoria;
estatísticas;
replay da partida (futuro);
geração de relatórios.
Wireframe Inicial
+----------------------------------------------------+
|                    MESA 08                         |
+----------------------------------------------------+

 João / Pedro                    08

 Carlos / Rafael                 06

 Tempo: 08:32

------------------------------------------------------

 [ +1 ]   [ +3 ]   [ +6 ]

 [ +9 ]   [ +12 ]

 [ DESFAZER ]

------------------------------------------------------

        [ CONFIRMAR VITÓRIA ]

+----------------------------------------------------+
Observações

A mesa é a menor unidade operacional da A2Sports360.

Toda a experiência do campeonato depende do correto funcionamento deste módulo.

Ela concentra:

controle da partida;
registro dos eventos;
atualização do telão;
atualização das estatísticas;
avanço automático das chaves.