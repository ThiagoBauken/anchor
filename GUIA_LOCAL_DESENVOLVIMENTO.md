# Guia de Desenvolvimento Local - AnchorView

**Objetivo:** Buildar e testar o AnchorView localmente antes do deploy em produção.

---

## 🎯 Pré-requisitos

### 1. Software Necessário

- [ ] **Node.js 18+** instalado
  ```bash
  node --version  # Deve ser v18.x ou superior
  ```
  Se não tiver: https://nodejs.org/

- [ ] **pnpm** instalado
  ```bash
  pnpm --version
  ```
  Se não tiver:
  ```bash
  npm install -g pnpm
  ```

- [ ] **Docker Desktop** instalado (para PostgreSQL)
  - Windows: https://www.docker.com/products/docker-desktop/
  - Verificar:
  ```bash
  docker --version
  docker-compose --version
  ```

- [ ] **Git** instalado (opcional, mas recomendado)
  ```bash
  git --version
  ```

---

## 🚀 Opção 1: Desenvolvimento com Docker (Recomendado)

**Vantagens:** PostgreSQL automático, ambiente idêntico à produção

### Passo 1: Preparar Variáveis de Ambiente

Crie `.env` na raiz do projeto:

```bash
# No PowerShell/CMD (Windows)
copy .env.example .env

# Ou crie manualmente
```

**Conteúdo do `.env`:**
```env
# Database Configuration
POSTGRES_USER=anchorview
POSTGRES_PASSWORD=dev123
POSTGRES_DB=anchorview_dev

# Database URL
DATABASE_URL=postgresql://anchorview:dev123@localhost:5432/anchorview_dev?schema=public

# Google Gemini AI (opcional para desenvolvimento)
GEMINI_API_KEY=sua-chave-aqui

# Node Environment
NODE_ENV=development
```

### Passo 2: Iniciar Docker Compose

```bash
# Navegar até a pasta do projeto
cd C:\Users\Thiago\Desktop\anchor

# Iniciar PostgreSQL + App
docker-compose up --build
```

**O que acontece:**
1. PostgreSQL sobe na porta 5432
2. Next.js app sobe na porta 9002
3. Migrations rodam automaticamente
4. Logs aparecem em tempo real

**Aguardar até ver:**
```
app_1  | ✓ Ready in 3.2s
app_1  | - Local:   http://localhost:9002
db_1   | database system is ready to accept connections
```

### Passo 3: Acessar a Aplicação

Abra no navegador:
```
http://localhost:9002
```

**Para parar:**
```bash
Ctrl+C

# Para remover containers
docker-compose down
```

**Para ver logs separadamente:**
```bash
# Em outro terminal
docker-compose logs -f app   # Logs do Next.js
docker-compose logs -f db    # Logs do PostgreSQL
```

---

## 🔧 Opção 2: Desenvolvimento sem Docker

**Vantagens:** Mais rápido para hot-reload, usa menos memória

### Passo 1: Instalar PostgreSQL Localmente

#### Windows (via Installer):
1. Download: https://www.postgresql.org/download/windows/
2. Instalar com senha: `dev123`
3. Porta padrão: `5432`

#### Windows (via Chocolatey):
```bash
choco install postgresql
```

#### Verificar instalação:
```bash
psql --version
```

### Passo 2: Criar Banco de Dados

```bash
# Abrir psql (PowerShell como Administrador)
psql -U postgres

# Dentro do psql:
CREATE DATABASE anchorview_dev;
CREATE USER anchorview WITH PASSWORD 'dev123';
GRANT ALL PRIVILEGES ON DATABASE anchorview_dev TO anchorview;
\q
```

### Passo 3: Configurar Variáveis de Ambiente

Crie `.env`:
```env
DATABASE_URL=postgresql://anchorview:dev123@localhost:5432/anchorview_dev?schema=public
GEMINI_API_KEY=sua-chave-aqui
NODE_ENV=development
```

### Passo 4: Instalar Dependências

```bash
cd C:\Users\Thiago\Desktop\anchor

# Instalar pacotes
pnpm install
```

**Aguardar (pode demorar 2-5 minutos na primeira vez):**
```
Progress: resolved 1234, reused 1100, downloaded 134
```

### Passo 5: Rodar Migrations

```bash
pnpm prisma migrate dev
```

**Deve mostrar:**
```
✔ Generated Prisma Client
✔ Applied migration 20250822000011_add_photos_table
```

### Passo 6: Iniciar Servidor de Desenvolvimento

```bash
pnpm dev
```

**Deve mostrar:**
```
▲ Next.js 15.0.0
- Local:        http://localhost:9002
- Turbopack enabled

✓ Ready in 2.1s
```

### Passo 7: Acessar a Aplicação

```
http://localhost:9002
```

---

## ✅ Testar Funcionalidades Principais

### 1. Criar Conta/Login

**Primeira vez:**
1. Acessar `http://localhost:9002`
2. Clicar em "Criar Conta"
3. Preencher:
   - Nome da empresa: `Empresa Teste`
   - Nome: `Admin Teste`
   - Email: `admin@teste.com`
   - Senha: `teste123`
4. Login automático

**Deve redirecionar para dashboard vazio**

### 2. Criar Projeto

1. Clicar em "Criar Primeiro Projeto"
2. Preencher:
   - Nome: `Edifício Solar`
   - Localização: `Teste Local`
   - Upload planta baixa (qualquer imagem)
3. Salvar

**Deve aparecer projeto na lista**

### 3. Adicionar Ponto de Ancoragem

1. Selecionar projeto criado
2. Ir para aba "Pontos"
3. Clicar na planta baixa (coloca marcador)
4. Preencher modal:
   - Número: `P1`
   - Localização: `Horizontal`
   - Tipo equipamento: `Olhal`
   - Lacre: `12345`
5. Salvar

**Deve aparecer marcador na planta**

### 4. Testar Captura de Foto (Desktop)

1. Clicar em ponto criado
2. Modal de detalhes → "Editar"
3. Clicar em "Capturar Foto do Ponto"
4. Permitir acesso à câmera
5. Tirar foto ou usar arquivo

**Deve mostrar preview da foto**

### 5. Testar Sincronização

Abra o DevTools do navegador (F12):
```javascript
// No Console
localStorage.getItem('anchorPoints')
```

**Deve mostrar JSON com ponto criado**

Verificar no banco:
```bash
# Em outro terminal
docker-compose exec db psql -U anchorview -d anchorview_dev

# Ou se instalou localmente:
psql -U anchorview -d anchorview_dev

# Dentro do psql:
SELECT * FROM "AnchorPoint";
SELECT * FROM photos;
\q
```

**Deve mostrar registros salvos**

### 6. Testar Exportação

1. Ir para aba "Relatórios"
2. Clicar em "Exportar Excel"
3. Arquivo deve fazer download

**Abrir no Excel e verificar dados**

---

## 🧪 Testes Avançados

### Testar PWA (Service Worker)

1. **Build de produção:**
```bash
pnpm build
pnpm start
```

2. **Acessar:** `http://localhost:9002`

3. **DevTools → Application → Service Workers**
   - Deve mostrar `sw.js` ativo

4. **Testar Offline:**
   - DevTools → Network → Selecione "Offline"
   - Navegar pelo app → Deve funcionar
   - Capturar foto → Deve salvar em IndexedDB

5. **Verificar IndexedDB:**
   - DevTools → Application → IndexedDB → `AnchorViewDB`
   - Verificar tabela `offlinePhotos`

### Testar Background Sync

1. Com network offline, capturar foto
2. Fechar aba
3. Ativar network novamente
4. Aguardar 1-2 minutos
5. Verificar logs:
```bash
docker-compose logs app | grep -i sync
```

**Deve mostrar:**
```
[Sync] Background sync triggered
[Sync] Photo uploaded successfully
```

### Testar Notificações Push

1. Acessar `http://localhost:9002/pwa-setup`
2. Clicar em "Solicitar Permissão para Notificações"
3. Permitir no navegador
4. Clicar em "Testar Notificação"

**Deve aparecer notificação do sistema**

---

## 🔍 Debugging

### Ver Logs do Next.js

```bash
# Se usando Docker
docker-compose logs -f app

# Se rodando direto
# Os logs aparecem no terminal onde rodou `pnpm dev`
```

### Ver Logs do Prisma

Adicionar no `.env`:
```env
DEBUG=prisma:*
```

Restart o servidor → Vai mostrar todas queries SQL

### Ver Logs do Service Worker

**DevTools → Console:**
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => console.log(reg));
});
```

### Resetar Banco de Dados

```bash
# Apagar tudo e recriar
pnpm prisma migrate reset

# Confirmar com 'y'
```

**⚠️ Isso apaga todos os dados!**

### Limpar Cache do Navegador

**Chrome:**
1. F12 → Application
2. Clear storage → Clear site data

**Ou:**
- Ctrl+Shift+Delete → Limpar tudo

---

## 📱 Testar no Celular (Mesma Rede WiFi)

### Passo 1: Descobrir IP do Computador

**Windows (PowerShell):**
```bash
ipconfig
# Procurar "Endereço IPv4" na conexão WiFi
# Ex: 192.168.1.100
```

### Passo 2: Ajustar Next.js para Aceitar Conexões Externas

Editar `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -p 9002 -H 0.0.0.0",
    "dev:turbo": "next dev --turbopack -p 9002 -H 0.0.0.0"
  }
}
```

Restart o servidor:
```bash
pnpm dev
```

### Passo 3: Acessar no Celular

No navegador do celular:
```
http://192.168.1.100:9002
```

(Substitua pelo IP do seu computador)

**Testar:**
- Login
- Criar ponto
- Capturar foto (câmera do celular)
- Modo offline

### Passo 4: Instalar PWA no Celular

**Android (Chrome):**
1. Acessar URL
2. Menu (⋮) → "Adicionar à tela inicial"
3. Ícone aparece na home

**iOS (Safari):**
1. Acessar URL
2. Botão Compartilhar
3. "Adicionar à Tela de Início"

---

## 🛠️ Comandos Úteis

### Gerenciar Dependências

```bash
# Adicionar pacote
pnpm add nome-do-pacote

# Adicionar pacote dev
pnpm add -D nome-do-pacote

# Remover pacote
pnpm remove nome-do-pacote

# Atualizar todos
pnpm update
```

### Gerenciar Banco de Dados

```bash
# Abrir Prisma Studio (GUI para o banco)
pnpm prisma studio
# Abre em http://localhost:5555

# Criar migration
pnpm prisma migrate dev --name nome_da_migration

# Resetar banco
pnpm prisma migrate reset

# Gerar cliente Prisma (após mudar schema)
pnpm prisma generate
```

### Build de Produção

```bash
# Build
pnpm build

# Rodar produção localmente
pnpm start

# Acessar http://localhost:9002
```

### Linting e Type Checking

```bash
# Verificar erros de lint
pnpm lint

# Verificar tipos TypeScript
pnpm typecheck
```

---

## ❌ Troubleshooting

### Problema: `pnpm: command not found`

**Solução:**
```bash
npm install -g pnpm
```

### Problema: Porta 9002 já em uso

**Descobrir o que está usando:**
```bash
# Windows
netstat -ano | findstr :9002

# Ver PID e matar processo
taskkill /PID <número> /F
```

**Ou mudar porta no `package.json`:**
```json
"dev": "next dev -p 9003"
```

### Problema: Erro de conexão com banco

**Verificar se PostgreSQL está rodando:**
```bash
# Docker
docker-compose ps

# Local
# Windows Services → PostgreSQL deve estar "Running"
```

**Testar conexão:**
```bash
psql -U anchorview -d anchorview_dev -h localhost
```

Se não conectar, verificar `DATABASE_URL` no `.env`

### Problema: Migrations falhando

**Erro:** `relation already exists`

**Solução:**
```bash
# Marcar migration como aplicada
pnpm prisma migrate resolve --applied <nome_da_migration>

# Ou resetar tudo (APAGA DADOS!)
pnpm prisma migrate reset
```

### Problema: Next.js não atualiza após mudanças

**Soluções:**
```bash
# 1. Limpar cache do Next.js
rm -rf .next

# Windows (PowerShell)
Remove-Item -Recurse -Force .next

# 2. Restart servidor
Ctrl+C
pnpm dev

# 3. Hard reload no navegador
Ctrl+Shift+R
```

### Problema: TypeScript mostrando erros

**Regenerar types do Prisma:**
```bash
pnpm prisma generate
```

**Restart do TypeScript Server no VSCode:**
- Ctrl+Shift+P → "TypeScript: Restart TS Server"

### Problema: Fotos não aparecem

**Verificar permissões da pasta:**
```bash
# Criar pasta se não existir
mkdir -p public/photos
```

**Verificar no código:** `src/app/api/sync/photos/route.ts`

---

## 📊 Checklist de Desenvolvimento Local

Antes de fazer deploy, verificar:

- [ ] App roda sem erros em `pnpm dev`
- [ ] Build de produção funciona (`pnpm build`)
- [ ] Migrations aplicam corretamente
- [ ] Login/Registro funciona
- [ ] Criar projeto funciona
- [ ] Adicionar ponto funciona
- [ ] Capturar foto funciona
- [ ] Sincronização salva no banco
- [ ] PWA funciona em build de produção
- [ ] Service Worker registra corretamente
- [ ] Modo offline funciona
- [ ] Background sync funciona
- [ ] App funciona no celular (mesma rede)
- [ ] Exportação Excel/PDF funciona
- [ ] Sem erros no console do navegador
- [ ] Sem erros de TypeScript (`pnpm typecheck`)
- [ ] Sem erros de lint (`pnpm lint`)

---

## 🎉 Próximos Passos

Depois de testar localmente:

1. **Deploy em produção:** Seguir [DEPLOY_EASYPANEL.md](DEPLOY_EASYPANEL.md)
2. **Corrigir responsividade:** Seguir [CORRECOES_RESPONSIVIDADE.md](CORRECOES_RESPONSIVIDADE.md)
3. **Adicionar plataformas mobile nativas:**
   ```bash
   npx cap add android
   npx cap add ios
   ```

---

## 📚 Referências

- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Capacitor Docs:** https://capacitorjs.com/docs
- **PWA Docs:** https://web.dev/progressive-web-apps/

---

**🚀 Pronto para começar o desenvolvimento local!**

**Comando rápido para iniciar:**
```bash
docker-compose up --build
```

**Ou sem Docker:**
```bash
pnpm install
pnpm prisma migrate dev
pnpm dev
```

Acesse: http://localhost:9002 🎉
