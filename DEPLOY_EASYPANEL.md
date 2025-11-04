# Deploy AnchorView no EasyPanel (Contabo)

**Status:** Pronto para Deploy
**Tempo Estimado:** 15-20 minutos
**Infraestrutura:** Contabo VPS + EasyPanel

---

## 🎯 Visão Geral

EasyPanel é um painel de controle Docker-based que simplifica o deploy de aplicações. O AnchorView já está 100% pronto para deploy via Docker.

**Vantagens do EasyPanel:**
- ✅ Interface visual amigável
- ✅ Deploy de docker-compose.yml direto
- ✅ SSL automático (Let's Encrypt)
- ✅ Gerenciamento de variáveis de ambiente
- ✅ Logs em tempo real
- ✅ Backups automáticos do PostgreSQL

---

## 📋 Pré-requisitos

### 1. No EasyPanel:
- [ ] Conta no EasyPanel configurada no Contabo
- [ ] Domínio apontado para o IP do servidor (opcional, mas recomendado)
- [ ] Acesso ao painel (ex: `https://panel.seudominio.com`)

### 2. No Projeto:
- [ ] Docker e docker-compose.yml já existem ✅
- [ ] Arquivo `.env` criado (veja abaixo)

---

## 🚀 Passo a Passo - Deploy no EasyPanel

### **Passo 1: Preparar Variáveis de Ambiente**

Crie um arquivo `.env` na raiz do projeto:

```env
# Database Configuration
POSTGRES_USER=anchorview
POSTGRES_PASSWORD=SuaSenhaSegura123!
POSTGRES_DB=anchorview_db

# Database URL (usado pelo Prisma)
DATABASE_URL=postgresql://anchorview:SuaSenhaSegura123!@db:5432/anchorview_db?schema=public

# Google Gemini AI (opcional, mas recomendado)
GEMINI_API_KEY=sua-api-key-aqui

# Node Environment
NODE_ENV=production
```

**⚠️ IMPORTANTE:** Mude `SuaSenhaSegura123!` para uma senha forte real.

---

### **Passo 2: Fazer Upload do Projeto para o Servidor**

#### Opção A: Via Git (Recomendado)

1. **No seu computador local:**
```bash
# Se ainda não tem Git inicializado
git init
git add .
git commit -m "Initial commit - AnchorView ready for production"

# Push para GitHub/GitLab (crie um repositório primeiro)
git remote add origin https://github.com/seu-usuario/anchorview.git
git push -u origin main
```

2. **No EasyPanel:**
   - Vá em "Projects" → "Create Project"
   - Selecione "GitHub" ou "GitLab"
   - Conecte seu repositório
   - EasyPanel vai clonar automaticamente

#### Opção B: Upload Direto (Se não quiser usar Git)

1. **Comprima o projeto:**
```bash
tar -czvf anchorview.tar.gz .
```

2. **No servidor Contabo (via SSH):**
```bash
# Conectar ao servidor
ssh root@seu-ip-contabo

# Criar diretório para o projeto
mkdir -p /opt/anchorview
cd /opt/anchorview

# Upload do arquivo (use SCP do seu computador)
# scp anchorview.tar.gz root@seu-ip-contabo:/opt/anchorview/

# Descomprimir
tar -xzvf anchorview.tar.gz
```

---

### **Passo 3: Deploy no EasyPanel**

#### Método 1: Docker Compose (Recomendado)

1. **No EasyPanel Dashboard:**
   - Vá em **"Projects"** → **"Create Project"**
   - Escolha **"Docker Compose"**

2. **Configurar o Projeto:**
   - **Project Name:** `anchorview`
   - **Docker Compose File:** Cole o conteúdo do `docker-compose.yml` (veja abaixo)

3. **Cole este docker-compose.yml otimizado:**

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    restart: always
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - anchorview_network

  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    depends_on:
      db:
        condition: service_healthy
    ports:
      - '9002:9002'
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - NODE_ENV=production
    command: >
      sh -c "pnpm prisma migrate deploy &&
             node server.js"
    networks:
      - anchorview_network

volumes:
  postgres_data:

networks:
  anchorview_network:
    driver: bridge
```

4. **Adicionar Variáveis de Ambiente:**
   - No EasyPanel, vá em **"Environment Variables"**
   - Adicione cada variável do `.env`:
     - `POSTGRES_USER` → `anchorview`
     - `POSTGRES_PASSWORD` → `SuaSenhaSegura123!`
     - `POSTGRES_DB` → `anchorview_db`
     - `DATABASE_URL` → `postgresql://anchorview:SuaSenhaSegura123!@db:5432/anchorview_db?schema=public`
     - `GEMINI_API_KEY` → sua chave
     - `NODE_ENV` → `production`

5. **Deploy:**
   - Clique em **"Deploy"**
   - EasyPanel vai fazer o build e iniciar os containers

---

#### Método 2: Deploy Manual via SSH (Alternativa)

Se preferir fazer via terminal SSH:

```bash
# Conectar ao servidor
ssh root@seu-ip-contabo

# Navegar até o projeto
cd /opt/anchorview

# Fazer build e iniciar
docker-compose up --build -d

# Ver logs
docker-compose logs -f app
```

---

### **Passo 4: Configurar Domínio e SSL**

#### No EasyPanel (Automático):

1. **Adicionar Domínio:**
   - No projeto AnchorView, vá em **"Domains"**
   - Clique em **"Add Domain"**
   - Digite: `anchorview.seudominio.com`
   - EasyPanel vai configurar automaticamente:
     - Nginx reverse proxy
     - Let's Encrypt SSL (HTTPS)

2. **Apontar DNS:**
   - No seu provedor de domínio (ex: Registro.br, GoDaddy), adicione:
   ```
   Tipo: A
   Nome: anchorview
   Valor: IP_DO_SERVIDOR_CONTABO
   TTL: 3600
   ```

3. **Aguardar Propagação:**
   - Pode levar 5 minutos a 24 horas
   - Teste com: `ping anchorview.seudominio.com`

---

### **Passo 5: Verificar Deploy**

#### 1. Checar Status dos Containers:

No EasyPanel:
- Vá em **"Services"** → Verifique se `db` e `app` estão **"Running"** (verde)

Via SSH:
```bash
docker-compose ps

# Deve mostrar:
# NAME                STATUS              PORTS
# anchorview_db_1     Up (healthy)        5432/tcp
# anchorview_app_1    Up                  0.0.0.0:9002->9002/tcp
```

#### 2. Testar Acesso:

**Sem domínio:**
```
http://seu-ip-contabo:9002
```

**Com domínio:**
```
https://anchorview.seudominio.com
```

#### 3. Verificar Logs:

No EasyPanel:
- Clique no serviço `app` → **"Logs"**

Via SSH:
```bash
docker-compose logs -f app

# Deve mostrar:
# [App] Server listening on port 9002
# [Prisma] Database connected
# [Next.js] Ready on http://localhost:9002
```

#### 4. Testar Banco de Dados:

```bash
docker-compose exec db psql -U anchorview -d anchorview_db

# Dentro do psql:
\dt  # Listar tabelas (deve mostrar User, Company, Project, Photo, etc.)
\q   # Sair
```

---

## 🔧 Configurações Adicionais

### 1. Backups Automáticos do PostgreSQL

Adicione ao `docker-compose.yml`:

```yaml
services:
  db-backup:
    image: prodrigestivill/postgres-backup-local
    restart: always
    volumes:
      - ./backups:/backups
    environment:
      - POSTGRES_HOST=db
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - SCHEDULE=@daily  # Backup diário
      - BACKUP_KEEP_DAYS=7
    depends_on:
      - db
    networks:
      - anchorview_network
```

### 2. Limites de Recursos (Opcional)

Se o servidor tiver recursos limitados:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 3. Monitoramento com Uptime Kuma (Recomendado)

EasyPanel tem integração com Uptime Kuma:
- Vá em **"Monitoring"** → **"Add Monitor"**
- URL: `https://anchorview.seudominio.com`
- Intervalo: 60 segundos
- Notificações: Email, Slack, Discord

---

## 📱 Configurar PWA para Mobile

Após deploy, usuários podem instalar o app:

### No Android:
1. Acessar `https://anchorview.seudominio.com` no Chrome
2. Menu (⋮) → **"Adicionar à tela inicial"**
3. Confirmar instalação

### No iOS:
1. Acessar no Safari
2. Botão Compartilhar → **"Adicionar à Tela de Início"**
3. Confirmar

**Offline mode funcionará automaticamente** (Service Worker já configurado).

---

## 🛠️ Comandos Úteis

### Ver Logs em Tempo Real:
```bash
docker-compose logs -f app
```

### Restart do App:
```bash
docker-compose restart app
```

### Executar Migrations Manualmente:
```bash
docker-compose exec app pnpm prisma migrate deploy
```

### Acessar Console do Banco:
```bash
docker-compose exec db psql -U anchorview -d anchorview_db
```

### Rebuild Completo (após mudanças):
```bash
docker-compose down
docker-compose up --build -d
```

### Ver Uso de Recursos:
```bash
docker stats
```

---

## ❌ Troubleshooting

### Problema: App não inicia (porta 9002 não responde)

**Diagnóstico:**
```bash
docker-compose logs app | tail -50
```

**Possíveis causas:**
1. **Migrations falharam:**
   ```bash
   docker-compose exec app pnpm prisma migrate deploy
   docker-compose restart app
   ```

2. **Variáveis de ambiente erradas:**
   - Verifique `DATABASE_URL` no EasyPanel
   - Formato correto: `postgresql://user:pass@db:5432/dbname?schema=public`

3. **Porta ocupada:**
   ```bash
   lsof -i :9002  # Ver o que está usando a porta
   ```

### Problema: Banco não conecta

**Verificar se o PostgreSQL está rodando:**
```bash
docker-compose ps db

# Se não estiver "healthy":
docker-compose logs db
```

**Testar conexão manualmente:**
```bash
docker-compose exec app sh
node -e "console.log(process.env.DATABASE_URL)"
# Verificar se a URL está correta
```

### Problema: SSL não ativa

**No EasyPanel:**
- Certifique-se que o domínio está apontado corretamente
- EasyPanel só emite SSL após DNS propagar
- Aguarde 5-10 minutos e clique em **"Retry SSL"**

### Problema: Fotos não fazem upload

**Verificar permissões do diretório:**
```bash
docker-compose exec app ls -la /app/public/photos
docker-compose exec app chmod -R 755 /app/public/photos
```

**Verificar espaço em disco:**
```bash
df -h
```

---

## 📊 Custos Estimados

### Contabo VPS (Já tem!):
- **VPS S SSD:** €4.99/mês (200GB SSD, 4GB RAM) ✅ Suficiente
- **VPS M SSD:** €8.99/mês (400GB SSD, 8GB RAM) - Ideal para produção
- **Bandwidth:** Ilimitado

### Extras (Opcional):
- **Domínio:** €10-15/ano (Registro.br, GoDaddy)
- **Backup externo:** €5/mês (opcional, EasyPanel já faz backup local)

**Total mensal:** Apenas o VPS que você já tem! 🎉

---

## 🎉 Checklist Final

Após deploy completo:

- [ ] App acessível em `https://anchorview.seudominio.com`
- [ ] SSL ativo (cadeado verde no navegador)
- [ ] Login funciona (testar com usuário admin)
- [ ] Criar projeto funciona
- [ ] Capturar foto offline funciona (testar no celular)
- [ ] Sincronização funciona (após captura offline)
- [ ] PWA instalável (botão "Adicionar à tela inicial" aparece)
- [ ] Offline mode funciona (desativar WiFi e navegar)
- [ ] Backups automáticos configurados
- [ ] Monitoramento ativo

---

## 📚 Referências

- **EasyPanel Docs:** https://easypanel.io/docs
- **Docker Compose:** https://docs.docker.com/compose/
- **Prisma Migrations:** https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Let's Encrypt SSL:** https://letsencrypt.org/

---

## 🆘 Suporte

Se tiver problemas:

1. **Logs são seus amigos:**
   ```bash
   docker-compose logs -f
   ```

2. **EasyPanel tem suporte via Discord:**
   - https://discord.gg/easypanel

3. **Documentação do projeto:**
   - Ver `GUIA_COMPLETO_DEPLOY.md` para alternativas (Vercel, Railway)
   - Ver `CORRECOES_RESPONSIVIDADE.md` para ajustes mobile

---

**🚀 Pronto! Seu AnchorView estará rodando em produção no EasyPanel!**

**Tempo total:** 15-20 minutos (após DNS propagar)
**Dificuldade:** Baixa (EasyPanel automatiza tudo)
**Resultado:** App production-ready com SSL, backups, e PWA funcionando! 🎉
