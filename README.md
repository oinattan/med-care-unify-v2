# MediConnect

Descrição
-----------
Aplicação frontend em React + TypeScript (Vite) para gerenciar conversas omnichannel e envio de emails. Inclui um worker Node.js para processar a fila de emails via SMTP e endpoints administrativos para retry/delete.

Conteúdo deste README
----------------------
- Como configurar o ambiente de desenvolvimento
- Variáveis de ambiente necessárias (frontend e worker)
- Como rodar frontend e worker localmente
- Migrações e notas sobre o banco (Supabase)
- Como commitar e enviar para um repositório remoto (GitHub)

Requisitos
----------
- Node.js 18+ e npm/yarn/pnpm
- Supabase (ou Postgres compatível)
- Acesso à chave `SERVICE_ROLE` do Supabase para rodar o worker

Instalação (local)
------------------
Abra um terminal na raiz do projeto e execute:

```cmd
cd /d c:\dev\med-care-unify
npm install
```

Variáveis de ambiente
----------------------
Frontend (arquivo `.env` ou variáveis do ambiente usadas pelo Vite):

- `VITE_SUPABASE_URL` — URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY` — anon/public key do Supabase (frontend)
- `VITE_RETRY_ENDPOINT` — (opcional) URL do servidor de retry (ex: `http://localhost:3001`)
- `VITE_RETRY_SECRET` — (opcional) secret para o endpoint de retry
- `VITE_ADMIN_ENDPOINT` — (opcional) URL do endpoint administrativo (delete)
- `VITE_ADMIN_SECRET` — (opcional) secret para o endpoint administrativo

Worker / Admin server (em `email-worker/`):

- `SUPABASE_URL` — URL do Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (necessário para operações administrativas e para o worker)
- `RETRY_SECRET` — secret usado pelos endpoints `/retry` e `/delete` (proteger acesso)
- `RETRY_SERVER_PORT` — porta do servidor de retry/admin (opcional, default `3001`)
- `SMTP_*` — (opcional) overrides de SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (útil para testes locais)

Como rodar em desenvolvimento
----------------------------

1) Frontend (dev):

```cmd
cd /d c:\dev\med-care-unify
npm run dev
```

2) Worker / Admin server (opcional, para retry/delete):

```cmd
cd /d c:\dev\med-care-unify\email-worker
set SUPABASE_URL=https://<seu-projeto>.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=<SUA_SERVICE_ROLE_KEY>
set RETRY_SECRET=<uma_senha_forte>
node server.js
```

Observação: o worker principal também pode ser executado diretamente via `node lib.js` / `node index.js` dependendo do script presente no `package.json` do `email-worker`.

Migrações / Banco (Supabase)
-----------------------------
- As migrações SQL geradas estão em `supabase/migrations/`.
- Antes de usar as novas features (ex.: `channels.config`, `assignee_id`) aplique as migrations no seu banco.

Usando o Supabase CLI (exemplo):

```cmd
supabase db push
```

Ou cole os arquivos SQL individualmente no SQL Editor do painel do Supabase e execute na ordem.

Operações administrativas seguras
--------------------------------
- Algumas ações sensíveis (ex.: excluir mensagens) podem falhar no frontend devido a RLS (Row Level Security). Para isso há um admin endpoint no `email-worker/server.js` protegido por `RETRY_SECRET` que executa operações com a `SUPABASE_SERVICE_ROLE_KEY`.
- Configure `VITE_ADMIN_ENDPOINT` e `VITE_ADMIN_SECRET` no frontend para permitir que a UI chame o endpoint `/delete` do servidor.

Git: commitar e enviar para Github
----------------------------------
Configure seu usuário Git (local ou global) para evitar erros ao commitar:

```cmd
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"
```

Commit e push:

```cmd
cd /d c:\dev\med-care-unify
git add .
git commit -m "Descrição das mudanças"
git remote add origin https://github.com/SEU_USUARIO/NOME_REPO.git
git push -u origin main
```

Se preferir criar o repositório via GitHub CLI (`gh`) posso gerar os comandos pra você.

Dicas de debugging rápido
-------------------------
- Verifique o Console do navegador e Network para chamadas ao Supabase.
- Para problemas do worker, veja os logs do `email-worker/server.js` — ele exibe quando usa `channels.config` ou fallback para `email_channels`.
- Se operações de escrita falham no frontend (ex.: delete/atribuir), verifique as políticas RLS no Supabase ou use o endpoint admin.

Contato / Suporte
-----------------
Se quiser que eu gere políticas RLS recomendadas ou um script para aplicar as migrations automaticamente, me avise que eu implemento em seguida.

----
Arquivo atualizado automaticamente com instruções essenciais para desenvolvimento e deploy.
