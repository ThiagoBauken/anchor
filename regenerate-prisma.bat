@echo off
cd /d D:\anchor
echo Regenerating Prisma client with correct DATABASE_URL...
echo DATABASE_URL=%DATABASE_URL%
npx prisma generate
echo Done!