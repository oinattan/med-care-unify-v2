# Email Worker

Este worker consome a tabela `messages` do Supabase procurando mensagens com `message_type = 'email'` e `status` igual a `queued`/`pending`, envia via SMTP usando as credenciais salvo em `email_channels` e atualiza o registro (`status`, `sent_at`, `error`).

Como usar

1. Copie o exemplo de variáveis de ambiente:

```cmd
copy .env.example .env
```

2. Preencha `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no `.env`.
3. Instale dependências (na pasta `email-worker`):

```cmd
cd email-worker
npm install
```

4. Rode o worker:

```cmd
npm start
```

Observações

- É recomendado usar a `SERVICE_ROLE` key do Supabase apenas no backend/worker (não expor no frontend).
- Para testes, use Mailtrap ou Ethereal e coloque as credenciais no registro de `email_channels` da sua base ou use as variáveis `SMTP_*` para forçar um transporte.
- O worker tenta marcar o registro como `sending` antes de enviar para evitar duplicações. Em caso de erro, atualiza `status` para `failed` e gravao `error`.
