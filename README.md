# Câmara Municipal de Juatuba - Sistema de Gestão RH

Sistema de Gestão de Recursos Humanos e Ativos de TI.

## Funcionalidades

- **Dashboard**: Visão geral dos indicadores.
- **Colaboradores**: Gestão de funcionários.
- **Gestão de Férias**: Controle de férias.
- **Reajustes**: Histórico e lançamento de reajustes.
- **Simulador Salarial**: Calculadora de salários base.
- **Aniversariantes**: Lista de aniversariantes do mês.
- **Impressoras**: Controle de ativos de TI e contadores de impressão.

## Tecnologias

- React
- Typescript
- Vite
- Supabase (Banco de Dados)

## Como Executar

1.  Instale as dependências:
    ```bash
    npm install
    ```

2.  Configure as variáveis de ambiente:
    Crie um arquivo `.env` na raiz do projeto com as credenciais do Supabase:
    ```env
    VITE_SUPABASE_URL=sua_url_supabase
    VITE_SUPABASE_ANON_KEY=sua_key_supabase
    ```

3.  Execute o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```

## Scripts

- `npm run dev`: Inicia o servidor de desenvolvimento.
- `npm run build`: Gera a versão de produção.
- `npm run preview`: Visualiza a versão de produção.

## Como Implantar na Vercel

1.  Acesse [Vercel](https://vercel.com).
2.  Clique em **"Add New"** > **"Project"**.
3.  Importe o repositório `gestor-cmj` do seu GitHub.
4.  No passo **Environment Variables**, adicione as seguintes variáveis:
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
    *   `GEMINI_API_KEY`
5.  Clique em **Deploy**.

O projeto já contém um arquivo `vercel.json` configurado para lidar com as rotas do React.
