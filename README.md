# Splitwise Clone

Um clone simples do Splitwise para divisão de despesas, desenvolvido com React, Node.js, TypeScript e SQLite.

## Funcionalidades

- **Autenticação**: Registro e Login com JWT.
- **Grupos**: Criar grupos, listar grupos, adicionar membros.
- **Despesas**: Adicionar despesas, dividir igualmente entre membros selecionados.
- **Saldos**: Cálculo automático de quem deve a quem.
- **Pagamentos**: Registrar pagamentos (Settle Up) para abater dívidas.

## Tecnologias

- **Frontend**: React (Vite), TypeScript, Tailwind CSS.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM.
- **Banco de Dados**: SQLite.

## Pré-requisitos

- Node.js (v16 ou superior)
- npm

## Instalação

1. Clone o repositório (ou extraia os arquivos).

2. Instale as dependências do Backend:
   ```bash
   cd backend
   npm install
   ```

3. Configure o Banco de Dados (Backend):
   ```bash
   # Dentro da pasta backend
   npx prisma migrate dev --name init
   ```

4. Instale as dependências do Frontend:
   ```bash
   cd ../frontend
   npm install
   ```

## Executando o Projeto

Você precisará de dois terminais abertos.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```
O servidor rodará em `http://localhost:3000`.

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
O frontend rodará em `http://localhost:5173` (ou outra porta indicada).

## Testes

Para rodar os testes do backend:

```bash
cd backend
npm test
```

## Estrutura do Projeto

- `backend/`: Código do servidor API.
  - `src/controllers`: Lógica dos endpoints.
  - `src/routes`: Definição das rotas.
  - `src/models`: Schema do Prisma.
- `frontend/`: Código da interface web.
  - `src/pages`: Páginas da aplicação.
  - `src/components`: Componentes reutilizáveis.
  - `src/context`: Gerenciamento de estado (Auth).
