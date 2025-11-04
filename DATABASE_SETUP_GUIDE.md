# 🔧 DATABASE SETUP GUIDE - ANCHORVIEW

## 🚨 PROBLEMAS IDENTIFICADOS

### 1. Conexão PostgreSQL
O erro `Can't reach database server at 'db:5432'` indica que o Prisma está usando uma configuração antiga/cached.

### 2. Solução Completa

#### Passo 1: Verificar .env
```bash
# Confirmar que DATABASE_URL está correto
DATABASE_URL="postgres://privado:privado12!@185.215.165.19:8002/privado?sslmode=disable"
```

#### Passo 2: Limpar cache e regenerar Prisma
```bash
# Limpar cache do Next.js e Prisma
rm -rf .next
rm -rf node_modules/.prisma
rm -rf prisma/generated

# Reinstalar dependências
npm install

# Regenerar cliente Prisma
npx prisma generate

# Executar migração
npx prisma db push
```

#### Passo 3: Executar SQL para criar tabelas SaaS
Execute o arquivo `create-saas-tables.sql` diretamente no PostgreSQL:

```bash
# Via psql (linha de comando)
PGPASSWORD=privado12! psql -U privado -h 185.215.165.19 -p 8002 -d privado -f create-saas-tables.sql

# Via DBeaver/pgAdmin
# Copie e cole o conteúdo de create-saas-tables.sql
```

#### Passo 4: Testar conexão
```bash
# Executar teste de conexão
node test-db-connection.js
```

## 🔥 COMANDOS DE EMERGENCY FIX

### Windows (PowerShell)
```powershell
# 1. Ir para diretório do projeto
cd D:\anchor

# 2. Parar servidor de desenvolvimento
# (Ctrl+C se estiver rodando)

# 3. Limpar tudo
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.prisma

# 4. Definir variável de ambiente temporariamente
$env:DATABASE_URL = "postgres://privado:privado12!@185.215.165.19:8002/privado?sslmode=disable"

# 5. Regenerar Prisma
npx prisma generate

# 6. Push do schema
npx prisma db push

# 7. Instalar mercadopago
npm install mercadopago

# 8. Iniciar servidor
npm run dev
```

### Linux/Mac (Bash)
```bash
# 1. Ir para diretório do projeto
cd /path/to/anchor

# 2. Limpar cache
rm -rf .next
rm -rf node_modules/.prisma

# 3. Definir variável de ambiente
export DATABASE_URL="postgres://privado:privado12!@185.215.165.19:8002/privado?sslmode=disable"

# 4. Regenerar Prisma
npx prisma generate

# 5. Push do schema  
npx prisma db push

# 6. Instalar mercadopago
npm install mercadopago

# 7. Iniciar servidor
npm run dev
```

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] ✅ DATABASE_URL correto no .env
- [ ] ✅ Cache Next.js limpo (.next removido)
- [ ] ✅ Cache Prisma limpo (node_modules/.prisma removido)
- [ ] ✅ Cliente Prisma regenerado (`npx prisma generate`)
- [ ] ✅ Schema enviado para banco (`npx prisma db push`)
- [ ] ✅ Tabelas SaaS criadas (via create-saas-tables.sql)
- [ ] ✅ Mercado Pago instalado (`npm install mercadopago`)
- [ ] ✅ Conexão testada (test-db-connection.js)
- [ ] ✅ Servidor funcionando (`npm run dev`)

## 🆘 SE AINDA NÃO FUNCIONAR

### Diagnóstico Adicional:

1. **Verificar se o banco está acessível:**
```bash
telnet 185.215.165.19 8002
```

2. **Testar conexão direta:**
```bash
PGPASSWORD=privado12! psql -U privado -h 185.215.165.19 -p 8002 -d privado -c "SELECT version();"
```

3. **Verificar logs do Next.js:**
- Procurar por linhas que mostram qual DATABASE_URL está sendo usada
- Verificar se há cache de configuração

4. **Forçar regeneração completa:**
```bash
# Remover TUDO relacionado a cache
rm -rf .next
rm -rf node_modules
rm -rf prisma/generated
rm package-lock.json

# Reinstalar tudo do zero
npm install
npx prisma generate
npx prisma db push
```

## 📝 LOGS ESPERADOS

Quando funcionar, você deve ver:
```
✅ Database connected successfully!
✅ Query executed successfully: [ { test: 1 } ]  
✅ Company table exists with X records
✅ User table exists with Y records
```

Ao invés de:
```
❌ Can't reach database server at `db:5432`
```

## 🎯 PRÓXIMOS PASSOS

Após corrigir a conexão:
1. Testar cadastro de usuários
2. Testar criação de projetos
3. Verificar sincronização localStorage → PostgreSQL
4. Testar funcionalidades SaaS (planos, pagamentos)

---
**Atualizado**: 19/08/2025
**Status**: Aguardando execução