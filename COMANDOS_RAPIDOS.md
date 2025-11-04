# ⚡ Comandos Rápidos - AnchorView

**Última atualização:** 20 de outubro de 2025

---

## 🚀 Iniciar Desenvolvimento

### Primeira vez (instalar dependências):
```bash
npm install
```

### Iniciar servidor:
```bash
npm run dev:no-turbo
```

**Acesse:** http://localhost:9002

**Parar:** `Ctrl+C`

---

## 📦 Comandos de Desenvolvimento

### Iniciar app
```bash
# Sem Turbopack (recomendado Windows)
npm run dev:no-turbo

# Com Turbopack (mais rápido, mas pode ter bugs)
npm run dev

# Limpar cache e iniciar
npm run dev:clean
```

### Build de produção
```bash
# Build
npm run build

# Rodar produção localmente
npm run start
```

### Qualidade de código
```bash
# TypeScript check
npm run typecheck

# Linting
npm run lint
```

---

## 🗄️ Comandos do Banco de Dados

### Prisma Studio (GUI do banco)
```bash
npm run db:studio
```
Abre em: http://localhost:5555

### Migrations
```bash
# Aplicar migrations pendentes
npm run db:setup

# Resetar banco (APAGA TUDO!)
npm run db:reset
```

### Gerar Prisma Client
```bash
npx prisma generate
```

### Conectar ao banco via CLI
```bash
psql -h 185.215.165.19 -p 8002 -U privado -d privado
# Senha: privado12!
```

Comandos dentro do psql:
```sql
-- Listar tabelas
\dt

-- Ver usuários
SELECT * FROM "User";

-- Ver projetos
SELECT * FROM "Project";

-- Ver pontos
SELECT * FROM "AnchorPoint";

-- Ver fotos
SELECT * FROM photos;

-- Sair
\q
```

---

## 🐳 Docker (Se instalado)

### Iniciar tudo
```bash
docker-compose up --build
```

### Iniciar em background
```bash
docker-compose up -d
```

### Parar
```bash
docker-compose down
```

### Ver logs
```bash
# Logs do app
docker-compose logs -f app

# Logs do banco
docker-compose logs -f db

# Logs de tudo
docker-compose logs -f
```

### Restart
```bash
docker-compose restart app
```

### Entrar no container
```bash
# App
docker-compose exec app sh

# Banco
docker-compose exec db psql -U privado -d privado
```

---

## 🧹 Limpeza

### Limpar cache do Next.js
```bash
# Windows (PowerShell)
Remove-Item -Recurse -Force .next

# Bash/CMD
rm -rf .next
```

### Reinstalar dependências
```bash
# Windows (PowerShell)
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Bash
rm -rf node_modules package-lock.json
npm install
```

### Limpar tudo e reinstalar
```bash
# PowerShell
Remove-Item -Recurse -Force node_modules, .next, package-lock.json
npm install
npm run dev:no-turbo
```

---

## 🔍 Debugging

### Ver versões instaladas
```bash
node --version
npm --version
npx prisma --version
```

### Ver processos na porta 9002
```bash
# Windows
netstat -ano | findstr :9002

# Matar processo (trocar PID)
taskkill /PID <numero> /F
```

### Verificar conectividade com banco
```bash
# Testar conexão
psql -h 185.215.165.19 -p 8002 -U privado -d privado

# Ver DATABASE_URL
cat .env | grep DATABASE_URL
```

### Logs do Next.js
Os logs aparecem no terminal onde você rodou `npm run dev:no-turbo`

### DevTools do navegador
```
F12 → Console
```

---

## 📱 Testar no Celular

### 1. Descobrir IP do PC
```bash
# Windows
ipconfig

# Procurar "Endereço IPv4" na conexão WiFi
# Exemplo: 192.168.0.21
```

### 2. Iniciar servidor permitindo conexões externas
Editar `package.json`:
```json
"dev:no-turbo": "next dev -p 9002 -H 0.0.0.0"
```

Depois:
```bash
npm run dev:no-turbo
```

### 3. Acessar do celular
```
http://192.168.0.21:9002
```
(Trocar pelo seu IP)

---

## 🆘 Troubleshooting Rápido

### Erro: Porta 9002 ocupada
```bash
netstat -ano | findstr :9002
taskkill /PID <numero> /F
```

### Erro: Cannot find module 'next'
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro: Prisma Client not generated
```bash
npx prisma generate
```

### Erro: Database connection failed
Verificar `.env`:
```env
DATABASE_URL="postgres://privado:privado12!@185.215.165.19:8002/privado?sslmode=disable"
```

### Erro: TypeScript errors
```bash
npx prisma generate
# VSCode: Ctrl+Shift+P → TypeScript: Restart TS Server
```

### Next.js não atualiza após mudanças
```bash
# Limpar cache
Remove-Item -Recurse -Force .next

# Restart
npm run dev:no-turbo

# Hard reload no navegador
Ctrl+Shift+R
```

---

## ⚡ Atalhos Essenciais

### Desenvolvimento diário
```bash
# Iniciar
npm run dev:no-turbo

# Ver banco
npm run db:studio
```

### Antes de commit
```bash
npm run typecheck
npm run lint
```

### Testar build
```bash
npm run build
npm run start
```

---

## 📊 Status Atual

**Servidor rodando em:**
- Local: http://localhost:9002
- Rede: http://192.168.0.21:9002

**Banco de dados:**
- Host: 185.215.165.19:8002
- Database: privado
- User: privado

**Node.js:** v22.20.0
**npm:** 11.6.1

---

## 🎯 Comandos Por Cenário

### Cenário: Começar o dia
```bash
cd C:\Users\Thiago\Desktop\anchor
npm run dev:no-turbo
# Acesse: http://localhost:9002
```

### Cenário: Testar mudanças
```bash
# Salvar arquivo
# Next.js recarrega automaticamente
# Refresh navegador (F5)
```

### Cenário: Ver dados do banco
```bash
npm run db:studio
# Acesse: http://localhost:5555
```

### Cenário: Fazer build para produção
```bash
npm run build
npm run start
# Acesse: http://localhost:9002
```

### Cenário: Deploy
```bash
# Ver guia específico
# DEPLOY_EASYPANEL.md
```

### Cenário: Resetar tudo (problemas)
```bash
Remove-Item -Recurse -Force node_modules, .next, package-lock.json
npm install
npm run dev:no-turbo
```

---

## 📚 Guias Relacionados

- **[COMECE_AQUI.md](COMECE_AQUI.md)** - Sumário executivo
- **[CHECKLIST_TESTE_LOCAL.md](CHECKLIST_TESTE_LOCAL.md)** - Validar funcionalidades
- **[DEPLOY_EASYPANEL.md](DEPLOY_EASYPANEL.md)** - Deploy em produção
- **[GUIA_LOCAL_DESENVOLVIMENTO.md](GUIA_LOCAL_DESENVOLVIMENTO.md)** - Guia completo

---

## 🔑 Comandos Mais Usados

```bash
# TOP 5 comandos que você vai usar:

1. npm run dev:no-turbo        # Iniciar desenvolvimento
2. npm run db:studio           # Ver dados do banco
3. npm run build               # Build de produção
4. npm run typecheck           # Verificar erros TypeScript
5. npx prisma generate         # Regenerar Prisma Client
```

---

**💡 Dica:** Salve este arquivo nos favoritos do navegador para acesso rápido!

**🚀 Comando para começar agora:**
```bash
npm run dev:no-turbo
```

**Acesse:** http://localhost:9002
