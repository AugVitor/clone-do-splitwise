# Opções de Deploy do Backend

Como seu backend usa Node.js e (atualmente) SQLite, você tem duas estratégias principais:

## Opção 1: Render.com (Recomendada para facilidade)

O Render é muito fácil de usar e tem um nível gratuito generoso.
**Nota**: Para usar o Render, você deve migrar para **PostgreSQL** (eles oferecem um banco Postgres gratuito também), pois o sistema de arquivos do plano gratuito é efêmero (apaga o SQLite ao reiniciar).

1. Crie uma conta no [Render.com](https://render.com).
2. Crie um **New Web Service**.
3. Conecte seu repositório GitHub.
4. Escolha a pasta `backend` como Root Directory.
5. Configurações:
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
6. Adicione as Variáveis de Ambiente:
   - `JWT_SECRET`: Sua chave.
   - `DATABASE_URL`: A URL do banco Postgres (crie um "New PostgreSQL" no Render e pegue a "Internal Connection URL").

## Opção 2: Fly.io (Para manter SQLite)

O Fly.io permite volumes de disco persistentes, então você pode manter o SQLite. É um pouco mais complexo de configurar (linha de comando).

1. Instale o `flyctl`.
2. Login: `fly auth login`.
3. Na pasta `backend`, rode `fly launch`.
4. Ele vai detectar o Dockerfile que criei.
5. Quando perguntar sobre banco de dados, você pode dizer não (pois usaremos SQLite no disco).
6. Crie um volume para o SQLite: `fly volumes create splitwise_data --size 1`.
7. Edite o `fly.toml` para montar o volume na pasta do banco.

## Opção 3: Vercel (Já configurado)

Como configuramos anteriormente, o Vercel é ótimo para "Serverless", mas **exige** PostgreSQL (Neon, Supabase ou Vercel Postgres).

- **Prós**: Integração perfeita com o frontend, muito rápido.
- **Contras**: Backend não fica "rodando" o tempo todo (cold starts), exige Postgres externo.

## Resumo

- Quer o caminho mais fácil e robusto? Use **Render** + **Postgres**.
- Quer manter SQLite a todo custo? Use **Fly.io**.
- Quer tudo no mesmo lugar do frontend? Use **Vercel** + **Postgres**.
