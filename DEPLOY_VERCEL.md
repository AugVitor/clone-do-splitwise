# Guia de Deploy no Vercel

Este projeto é um monorepo (frontend e backend no mesmo repositório). Para fazer o deploy no Vercel, você deve criar **dois projetos separados** no painel da Vercel, ambos conectados a este repositório.

## ⚠️ Importante: Banco de Dados

O Vercel é uma plataforma Serverless e **não suporta bancos de dados SQLite locais** (o arquivo `dev.db` seria apagado a cada deploy).

Para produção, você deve usar um banco PostgreSQL (ex: Vercel Postgres, Neon, Supabase).

### Passos para Migrar para PostgreSQL (Produção)

1. Crie um banco de dados Postgres (ex: no Vercel Storage).
2. Obtenha a `POSTGRES_PRISMA_URL` ou `DATABASE_URL`.
3. No arquivo `backend/prisma/schema.prisma`, altere o provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   *(Nota: Isso quebrará o ambiente local se você não tiver Postgres local. Recomendo manter SQLite localmente e mudar apenas no branch de deploy ou usar variáveis de ambiente para trocar o schema, mas o jeito mais simples é mudar o provider antes do commit de deploy).*

## 1. Deploy do Backend

1. No Vercel, clique em "Add New Project".
2. Importe este repositório.
3. Em **Framework Preset**, selecione **Other**.
4. Em **Root Directory**, clique em Edit e selecione a pasta `backend`.
5. Em **Environment Variables**, adicione:
   - `JWT_SECRET`: (Sua chave secreta)
   - `DATABASE_URL`: (Sua string de conexão Postgres)
6. Clique em **Deploy**.
7. Copie a URL do projeto (ex: `https://meu-backend.vercel.app`).

## 2. Deploy do Frontend

1. Volte ao dashboard e clique em "Add New Project" novamente.
2. Importe o **mesmo repositório**.
3. Em **Framework Preset**, o Vercel deve detectar **Vite**.
4. Em **Root Directory**, selecione a pasta `frontend`.
5. Em **Environment Variables**, adicione:
   - `VITE_API_URL`: A URL do backend que você copiou + `/api` (ex: `https://meu-backend.vercel.app/api`).
6. Clique em **Deploy**.

## Comandos de Build (Backend)

Se o Vercel perguntar, os comandos padrão devem funcionar, mas garanta que:
- Build Command: `npm run build` (ou deixe vazio se não tiver build step complexo, mas o TS precisa compilar se não usar ts-node no runtime. Para Vercel serverless com TS, geralmente não precisa de build explícito se configurado corretamente, mas o ideal é compilar para JS).
- Output Directory: `dist` (se compilar).

*Dica*: Para o backend serverless simples que configuramos (`api/index.ts`), o Vercel lida com a transpilação automaticamente se o `tsconfig.json` estiver correto.
