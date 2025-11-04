@echo off
echo Fixing HMR errors by clearing cache and restarting...

echo.
echo Step 1: Killing any running Node processes...
taskkill /F /IM node.exe 2>nul

echo.
echo Step 2: Removing .next cache directory...
if exist .next rmdir /s /q .next

echo.
echo Step 3: Removing node_modules...
if exist node_modules rmdir /s /q node_modules

echo.
echo Step 4: Removing package-lock.json...
if exist package-lock.json del package-lock.json

echo.
echo Step 5: Installing dependencies...
npm install

echo.
echo Step 6: Starting development server...
npm run dev

pause