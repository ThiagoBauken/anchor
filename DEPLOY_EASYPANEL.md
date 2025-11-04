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

**⚠️ IMPORTANTE:** Se sua senha contém caracteres especiais (!, @, #, $, etc.), você DEVE codificá-los em URL:
- `!` → `%21`
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`

**Exemplo:**
- Senha: `privado12!`
- DATABASE_URL: `postgresql://anchor:privado12%21@postgres-service:5432/anchorview`

```env
# Database (URL-encode special characters in password!)
DATABASE_URL=postgresql://anchor:SUA_SENHA_CODIFICADA@postgres-service:5432/anchorview?sslmode=disable

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://seu-dominio.easypanel.host
PORT=9002

# Authentication (REQUIRED)
JWT_SECRET=sua-chave-secreta-super-segura-aqui-minimo-32-caracteres

# Google AI (Genkit)
GEMINI_API_KEY=sua-api-key-do-gemini

# Next.js
NEXT_TELEMETRY_DISABLED=1
```

### 4. Configurar Build Settings

1. **Build Command**: `npm run build`
2. **Start Command**: Deixe em branco (Dockerfile cuida)
3. **Port**: `9002`
4. **Dockerfile**: Ativado ✅

### 5. Deploy

Clique em **"Deploy"** e aguarde (5-10 minutos)

### 6. Pós-Deploy (Primeira Vez)

Após o primeiro deploy bem-sucedido:

1. **Rodar Migrações do Banco:**
   ```bash
   # SSH no container ou use terminal do EasyPanel
   npx prisma migrate deploy
   ```

2. **Criar Superadmin (Opcional):**
   ```bash
   node create-superadmin.js
   # Login: admin@anchorview.com
   # Senha: admin123
   ```

3. **Verificar Logs:**
   - Procure por: `✅ Database connection successful`
   - Se aparecer `❌ Database connection failed`, verifique o DATABASE_URL

### 7. Troubleshooting

Se encontrar erros, consulte: [DEPLOY_TROUBLESHOOTING.md](./DEPLOY_TROUBLESHOOTING.md)

**Erros comuns:**
- `Database connection failed` → Verifique URL encoding de caracteres especiais
- `authentication failed` → Verifique usuário/senha do PostgreSQL
- `Connection refused` → Verifique se PostgreSQL está rodando

---

**Última atualização**: 2025-11-04
