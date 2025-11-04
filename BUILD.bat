@echo off
echo ========================================
echo   AnchorView - Build de Producao
echo ========================================
echo.

echo [1/3] Limpando cache anterior...
if exist .next rmdir /s /q .next
echo Cache limpo!

echo.
echo [2/3] Rodando type checking...
call pnpm typecheck
if %errorlevel% neq 0 (
    echo.
    echo AVISO: Encontrados erros de TypeScript
    echo Pressione qualquer tecla para continuar mesmo assim...
    pause >nul
)

echo.
echo [3/3] Fazendo build de producao...
call pnpm build
if %errorlevel% neq 0 (
    echo.
    echo ERRO: Build falhou!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Build Concluido com Sucesso!
echo ========================================
echo.
echo Para testar o build de producao:
echo     pnpm start
echo.
echo Acesse: http://localhost:9002
echo ========================================
echo.

pause
