@echo off
echo 🧹 Limpando cache do Next.js e Node.js...

if exist ".next" (
    rmdir /s /q ".next"
    echo ✅ Pasta .next removida
) else (
    echo ⚠️ Pasta .next não encontrada
)

if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo ✅ Cache do node_modules removido
) else (
    echo ⚠️ Cache do node_modules não encontrado
)

echo.
echo 🚀 Cache limpo! Execute: npm run dev
pause