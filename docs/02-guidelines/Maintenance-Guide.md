# Maintenance Guide

Este guia lista boas práticas para manutenção da codebase e operação dos serviços em produção.

## Diagnosticando Problemas (Troubleshooting)

### Logs e Auditoria
Aplicações em produção enviam alertas sobre gargalos na resolução de quedas e alocação de Locais de Jogo. O painel da Vercel armazena os Server Logs. 

### Resolvendo Bugs em Produção
1. Se for uma falha de domínio, verifique no arquivo `index.ts` do respectivo Engine quais métodos estão expostos.
2. Certifique-se de que nenhum componente está fazendo requisições ilegais diretamente para o Repositório ou banco de dados (`supabase.from(...)`).
3. Siga o fluxo rigoroso de Services e Repositories. Nunca emende a lógica no Component ou Route Handler.

## Dependências e Atualizações
A auditoria periódica (Dependency Audit) avalia gargalos estruturais e imports cruzados não intencionais entre domínios restritos. Não aprove atualizações que rasguem as definições estruturais propostas em `Domain-Boundaries.md`.
