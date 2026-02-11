# Guia de Deploy no Vercel

Este projeto está configurado para ser implantado no Vercel. Siga os passos abaixo:

## 1. Configuração do Projeto no Vercel

1.  Acesse o [Painel do Vercel](https://vercel.com/dashboard).
2.  Clique em **"Add New..."** -> **"Project"**.
3.  Importe o repositório do GitHub: `Dupente/Gestor-CMj-Vale-Transporte`.

## 2. Configurações de Build

O Vercel deve detectar automaticamente as configurações, mas confirme se estão como abaixo:

-   **Framework Preset:** Vite
-   **Root Directory:** `./`
-   **Build Command:** `npm run build` (ou `vite build`)
-   **Output Directory:** `dist`
-   **Install Command:** `npm install`

## 3. Variáveis de Ambiente

É CRUCIAL adicionar as seguintes variáveis de ambiente nas configurações do projeto no Vercel (**Settings** -> **Environment Variables**):

| Nome da Variável | Valor |
| :--- | :--- |
| `VITE_SUPABASE_URL` | https://dmlljmbbsstecdolfaqg.supabase.co |
| `VITE_SUPABASE_ANON_KEY` | sb_publishable_kzFvKbTRbdQF-Sj7V71I1w_otAKaAeM |
| `GEMINI_API_KEY` | (Sua chave da API Gemini, se aplicável) |

> **Nota:** As chaves do Supabase acima são públicas/anonimas e seguras para serem usadas no frontend, mas é boa prática mantê-las em variáveis de ambiente.

## 4. Deploy

Após configurar as variáveis, clique em **Deploy**. O Vercel irá construir e publicar sua aplicação.

## Arquivos Importantes

-   `vercel.json`: Configura o roteamento para SPA (Single Page Application).
-   `vite.config.ts`: Configuração do bundler Vite.
