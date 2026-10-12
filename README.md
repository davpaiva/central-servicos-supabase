# Central de Serviços (React + Supabase + GitHub Pages)

Sistema de exemplo com tela de login, feito para aprender. Os dados são inventados.

- **React** (pasta `src/`): as telas
- **Supabase**: login, banco de dados e regras de acesso (arquivos em `supabase/`)
- **GitHub Pages**: hospeda as telas. O GitHub Actions monta o site sozinho a cada envio (`.github/workflows/publicar.yml`)

## Configuração (resumo)

1. No Supabase, crie um projeto e rode no SQL Editor, nesta ordem:
   `supabase/01-estrutura.sql` e `supabase/02-dados.sql`
2. Em Authentication > Users > Add user, crie `ana.ribeiro@example.com` e
   `joao.martins@example.com` (senha `senha123`, marcando Auto Confirm User)
3. Rode `supabase/03-usuarios.sql`
4. Desligue novos cadastros (Authentication > Sign In / Providers > Allow new users to sign up)
5. No GitHub: Settings > Secrets and variables > Actions > Variables, crie
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
6. Settings > Pages > Source: **GitHub Actions**

## Rodar no computador (opcional, precisa do Node.js)

Copie `.env.exemplo` para `.env`, preencha, e rode:

```
npm install
npm run dev
```
