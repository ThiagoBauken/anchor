# 🚀 Início Rápido - AnchorView

**Seu ambiente:**
- ✅ Node.js v22.20.0
- ✅ npm 11.6.1
- ❌ Docker não instalado
- ❌ pnpm não instalado

---

## Opção 1: Testar Agora Mesmo (SEM Docker)

**Tempo:** 5 minutos

### Passo 1: Instalar pnpm (Recomendado)

```bash
npm install -g pnpm
```

Ou use npm diretamente (mais lento):
```bash
# Trocar todos comandos `pnpm` por `npm` abaixo
```

### Passo 2: Instalar Dependências

```bash
cd C:\Users\Thiago\Desktop\anchor
pnpm install
# Ou: npm install
```

**Aguardar 2-5 minutos...**

### Passo 3: Verificar .env

Você já tem `.env` configurado! Verificar se está correto:

```bash
cat .env
```

Deve ter algo como:
```env
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
```

### Passo 4: Iniciar Servidor de Desenvolvimento

**⚠️ IMPORTANTE:** Como você não tem Docker, precisa de PostgreSQL local OU usar o banco da Contabo.

#### Opção A: Usar Banco da Contabo (Rápido)

Editar `.env` para apontar para o banco remoto:
```env
DATABASE_URL=postgresql://usuario:senha@ip-contabo:5432/anchorview_db?schema=public
```

#### Opção B: Instalar PostgreSQL Local

**Windows (Chocolatey):**
```bash
choco install postgresql
```

**Windows (Installer):**
- Download: https://www.postgresql.org/download/windows/
- Senha: `dev123`

Depois criar banco:
```bash
psql -U postgres
CREATE DATABASE anchorview_dev;
\q
```

### Passo 5: Rodar Migrations

```bash
pnpm prisma migrate deploy
# Ou: npm run prisma migrate deploy
```

### Passo 6: Iniciar App

```bash
pnpm dev
# Ou: npm run dev
```

**Aguardar até ver:**
```
▲ Next.js 15.0.0
- Local:   http://localhost:9002
✓ Ready in 2.1s
```

### Passo 7: Acessar

Abra no navegador:
```
http://localhost:9002
```

---

## Opção 2: Usar Docker (Recomendado para Produção)

### Instalar Docker Desktop

**Windows:**
1. Download: https://www.docker.com/products/docker-desktop/
2. Instalar
3. Restart do PC

**Verificar:**
```bash
docker --version
docker-compose --version
```

### Iniciar Tudo com Um Comando

```bash
cd C:\Users\Thiago\Desktop\anchor
docker-compose up --build
```

**Isso vai:**
1. Subir PostgreSQL automaticamente
2. Rodar migrations
3. Iniciar Next.js app
4. Tudo pronto em 3-5 minutos

**Acessar:**
```
http://localhost:9002
```

---

## 🧪 Testar Funcionalidades

### 1. Criar Conta

1. Acessar `http://localhost:9002`
2. Clicar "Criar Conta"
3. Preencher:
   - Empresa: `Teste LTDA`
   - Nome: `Admin Teste`
   - Email: `admin@teste.com`
   - Senha: `teste123`

### 2. Criar Projeto

1. "Criar Primeiro Projeto"
2. Nome: `Edifício Solar`
3. Upload planta baixa (qualquer imagem)
4. Salvar

### 3. Adicionar Ponto

1. Clicar na planta baixa
2. Preencher modal:
   - Número: `P1`
   - Localização: `Horizontal`
   - Lacre: `12345`
3. Salvar

### 4. Ver Dados no Banco

```bash
# Se usando Docker
docker-compose exec db psql -U anchorview -d anchorview_dev

# Se PostgreSQL local
psql -U anchorview -d anchorview_dev

# Dentro do psql:
SELECT * FROM "AnchorPoint";
\q
```

---

## 📱 Testar no Celular

### Descobrir IP do PC

**Windows (PowerShell):**
```bash
ipconfig
# Procurar "Endereço IPv4" no WiFi
# Ex: 192.168.1.100
```

### Permitir Conexões Externas

Editar `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -p 9002 -H 0.0.0.0"
  }
}
```

Restart servidor:
```bash
pnpm dev
```

### Acessar no Celular

No navegador do celular (mesma rede WiFi):
```
http://192.168.1.100:9002
```

(Trocar pelo seu IP)

**Testar:**
- Capturar foto com câmera do celular
- Modo offline (desligar WiFi)
- Instalar PWA ("Adicionar à tela inicial")

---

## ❌ Problemas Comuns

### Porta 9002 ocupada

```bash
# Ver o que está usando
netstat -ano | findstr :9002

# Matar processo (trocar PID)
taskkill /PID 1234 /F

# Ou mudar porta em package.json
"dev": "next dev -p 9003"
```

### Erro de conexão com banco

Verificar `.env`:
```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/banco?schema=public
```

Testar conexão:
```bash
psql -U anchorview -d anchorview_dev -h localhost
```

### Next.js não atualiza

```bash
# Limpar cache
rm -rf .next
# Ou Windows (PowerShell):
Remove-Item -Recurse -Force .next

# Restart
pnpm dev
```

### TypeScript errors

```bash
pnpm prisma generate
# Restart VSCode TypeScript
# Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

## 🎉 Comandos Mais Usados

```bash
# Instalar dependências
pnpm install

# Desenvolvimento
pnpm dev

# Build de produção
pnpm build
pnpm start

# Banco de dados
pnpm prisma migrate dev      # Rodar migrations
pnpm prisma studio           # GUI do banco (http://localhost:5555)
pnpm prisma generate         # Gerar Prisma Client

# Qualidade
pnpm lint                    # Verificar erros
pnpm typecheck               # Verificar TypeScript

# Docker
docker-compose up --build    # Iniciar tudo
docker-compose down          # Parar tudo
docker-compose logs -f app   # Ver logs
```

---

## 📚 Próximos Passos

Depois de testar localmente:

1. **Aplicar correções mobile:**
   - Ver [CORRECOES_RESPONSIVIDADE.md](CORRECOES_RESPONSIVIDADE.md)

2. **Deploy em produção:**
   - Ver [DEPLOY_EASYPANEL.md](DEPLOY_EASYPANEL.md)

3. **Guia completo:**
   - Ver [GUIA_LOCAL_DESENVOLVIMENTO.md](GUIA_LOCAL_DESENVOLVIMENTO.md)

---

## 🆘 Precisa de Ajuda?

**Verificar documentação:**
- [CLAUDE.md](CLAUDE.md) - Visão geral do projeto
- [GUIA_COMPLETO_DEPLOY.md](GUIA_COMPLETO_DEPLOY.md) - Opções de hospedagem
- [CORRECOES_APLICADAS.md](CORRECOES_APLICADAS.md) - O que já foi feito

**Logs são seus amigos:**
```bash
# Ver logs do Next.js
pnpm dev

# Ver logs do Docker
docker-compose logs -f

# DevTools do navegador
F12 → Console
```

---

**🚀 Comando para começar AGORA:**

```bash
cd C:\Users\Thiago\Desktop\anchor
npm install -g pnpm
pnpm install
pnpm dev
```

**Acessar:** http://localhost:9002 🎉
