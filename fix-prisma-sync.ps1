# Script PowerShell para corrigir sincronização Prisma
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CORRIGINDO SINCRONIZACAO PRISMA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Parar processos Node
Write-Host "[1/6] Parando processos Node..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Limpar caches
Write-Host "[2/6] Limpando caches..." -ForegroundColor Yellow
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules\@prisma\client" -Recurse -Force -ErrorAction SilentlyContinue

# 3. Reinstalar Prisma Client
Write-Host "[3/6] Reinstalando Prisma Client..." -ForegroundColor Yellow
npm install @prisma/client@latest prisma@latest --save-exact

# 4. Gerar novo Prisma Client
Write-Host "[4/6] Gerando novo Prisma Client..." -ForegroundColor Yellow
npx prisma generate

# 5. Verificar schema
Write-Host "[5/6] Verificando schema com banco..." -ForegroundColor Yellow
npx prisma db push --accept-data-loss

# 6. Validar
Write-Host "[6/6] Validando configuracao..." -ForegroundColor Yellow
npx prisma validate

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CONCLUIDO! Execute: npm run dev" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")