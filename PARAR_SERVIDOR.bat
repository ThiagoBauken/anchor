@echo off
echo ========================================
echo   AnchorView - Parar Servidor
echo ========================================
echo.

echo Procurando processo na porta 9002...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9002 ^| findstr LISTENING') do (
    echo Processo encontrado: %%a
    echo Matando processo...
    taskkill /PID %%a /F
    echo Processo finalizado!
    goto :done
)

echo Nenhum processo encontrado na porta 9002.
echo.

:done
echo.
echo ========================================
echo   Porta 9002 liberada!
echo ========================================
pause
