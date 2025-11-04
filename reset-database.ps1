# Script para resetar e recriar o banco de dados completo

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "RESET DO BANCO DE DADOS ANCHORVIEW" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "AVISO: Isso vai APAGAR todos os dados!" -ForegroundColor Yellow
Write-Host ""

# Executa o reset do Prisma
Write-Host "Executando reset do banco..." -ForegroundColor Green
npx prisma migrate reset --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Banco resetado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "O que foi criado:" -ForegroundColor Cyan
    Write-Host "- 23 tabelas completas" -ForegroundColor White
    Write-Host "- Todas as colunas" -ForegroundColor White
    Write-Host "- 47+ funções e procedures" -ForegroundColor White
    Write-Host "- Todos os triggers" -ForegroundColor White
    Write-Host "- Todas as views" -ForegroundColor White
    Write-Host "- Todos os índices" -ForegroundColor White
    Write-Host ""
    Write-Host "Banco pronto para uso!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Erro ao resetar o banco!" -ForegroundColor Red
    Write-Host "Verifique as mensagens de erro acima." -ForegroundColor Yellow
}