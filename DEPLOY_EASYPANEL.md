# Deploy no EasyPanel

Guia para fazer deploy do AnchorView no EasyPanel.

## 📋 Pré-requisitos

1. Conta no EasyPanel
2. Repositório no GitHub (já configurado: https://github.com/ThiagoBauken/anchor.git)
3. Chave API do Google Gemini (https://aistudio.google.com/app/apikey)

## 🚀 Passo a Passo

### 1. Criar Novo Projeto no EasyPanel

1. Acesse seu painel EasyPanel
2. Clique em **"Create Project"**
3. Escolha **"GitHub"** como source
4. Conecte o repositório: `ThiagoBauken/anchor`
5. Branch: `main`

### 2. Configurar Banco de Dados PostgreSQL

No EasyPanel, adicione um serviço PostgreSQL:

1. Clique em **"Add Service"** → **"PostgreSQL"**
2. Configure:
   - **Database Name**: `anchorview`
   - **Username**: `anchor`
   - **Password**: [gere uma senha forte]
   - **Version**: PostgreSQL 15

3. Copie a **Connection String** gerada

### 3. Configurar Variáveis de Ambiente

```env
DATABASE_URL=postgresql://anchor:SUA_SENHA@postgres-service:5432/anchorview
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://seu-dominio.easypanel.host
PORT=9002
JWT_SECRET=sua-chave-secreta-super-segura-aqui
GEMINI_API_KEY=sua-api-key-do-gemini
NEXT_TELEMETRY_DISABLED=1
```

### 4. Configurar Build Settings

1. **Build Command**: `npm run build`
2. **Start Command**: Deixe em branco (Dockerfile cuida)
3. **Port**: `9002`
4. **Dockerfile**: Ativado ✅

### 5. Deploy

Clique em **"Deploy"** e aguarde (5-10 minutos)

---

**Última atualização**: 2025-11-04
