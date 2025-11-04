@echo off
echo Fixing Location schema...

echo.
echo 1. Generating Prisma client...
call npx prisma generate

echo.
echo 2. Creating migration...
call npx prisma migrate dev --name "make_projectid_optional_add_markercolor"

echo.
echo Schema fixed! You can now run the application.
pause