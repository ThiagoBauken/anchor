@echo off
echo ========================================
echo   CORRIGINDO COMPONENTES QUEBRADOS
echo ========================================
cd /d D:\anchor

echo Substituindo useAnchorData por useOfflineData em todos os arquivos...

powershell -Command "(Get-Content 'src\components\tests-tab.tsx') -replace 'useAnchorData', 'useOfflineData' | Set-Content 'src\components\tests-tab.tsx'"
powershell -Command "(Get-Content 'src\components\tests-tab.tsx') -replace '@/context/AnchorDataContext', '@/context/OfflineDataContext' | Set-Content 'src\components\tests-tab.tsx'"

powershell -Command "(Get-Content 'src\components\dashboard-tab.tsx') -replace 'useAnchorData', 'useOfflineData' | Set-Content 'src\components\dashboard-tab.tsx'"
powershell -Command "(Get-Content 'src\components\dashboard-tab.tsx') -replace '@/context/AnchorDataContext', '@/context/OfflineDataContext' | Set-Content 'src\components\dashboard-tab.tsx'"

powershell -Command "(Get-Content 'src\components\point-card.tsx') -replace 'useAnchorData', 'useOfflineData' | Set-Content 'src\components\point-card.tsx'"
powershell -Command "(Get-Content 'src\components\point-card.tsx') -replace '@/context/AnchorDataContext', '@/context/OfflineDataContext' | Set-Content 'src\components\point-card.tsx'"

powershell -Command "(Get-Content 'src\components\point-details-modal.tsx') -replace 'useAnchorData', 'useOfflineData' | Set-Content 'src\components\point-details-modal.tsx'"
powershell -Command "(Get-Content 'src\components\point-details-modal.tsx') -replace '@/context/AnchorDataContext', '@/context/OfflineDataContext' | Set-Content 'src\components\point-details-modal.tsx'"

powershell -Command "(Get-Content 'src\components\users-tab.tsx') -replace 'useAnchorData', 'useOfflineData' | Set-Content 'src\components\users-tab.tsx'"
powershell -Command "(Get-Content 'src\components\users-tab.tsx') -replace '@/context/AnchorDataContext', '@/context/OfflineDataContext' | Set-Content 'src\components\users-tab.tsx'"

powershell -Command "(Get-Content 'src\components\points-gallery.tsx') -replace 'useAnchorData', 'useOfflineData' | Set-Content 'src\components\points-gallery.tsx'"
powershell -Command "(Get-Content 'src\components\points-gallery.tsx') -replace '@/context/AnchorDataContext', '@/context/OfflineDataContext' | Set-Content 'src\components\points-gallery.tsx'"

powershell -Command "(Get-Content 'src\components\map-tab.tsx') -replace 'useAnchorData', 'useOfflineData' | Set-Content 'src\components\map-tab.tsx'"
powershell -Command "(Get-Content 'src\components\map-tab.tsx') -replace '@/context/AnchorDataContext', '@/context/OfflineDataContext' | Set-Content 'src\components\map-tab.tsx'"

powershell -Command "(Get-Content 'src\components\line-tool-dialog.tsx') -replace 'useAnchorData', 'useOfflineData' | Set-Content 'src\components\line-tool-dialog.tsx'"
powershell -Command "(Get-Content 'src\components\line-tool-dialog.tsx') -replace '@/context/AnchorDataContext', '@/context/OfflineDataContext' | Set-Content 'src\components\line-tool-dialog.tsx'"

echo.
echo ✅ Componentes corrigidos!
echo.
pause