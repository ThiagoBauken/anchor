@echo off
REM Comando Windows para corrigir banco PostgreSQL

REM Configurar credenciais
echo private_alpdb:5432:privado:privado:privado12! >> %USERPROFILE%\.pgpass

REM Executar SQL diretamente
psql -h private_alpdb -p 5432 -U privado -d privado -c "ALTER TABLE anchor_points ADD COLUMN IF NOT EXISTS foto TEXT;"
psql -h private_alpdb -p 5432 -U privado -d privado -c "ALTER TABLE anchor_tests ADD COLUMN IF NOT EXISTS foto_teste TEXT;"
psql -h private_alpdb -p 5432 -U privado -d privado -c "ALTER TABLE anchor_tests ADD COLUMN IF NOT EXISTS foto_pronto TEXT;"
psql -h private_alpdb -p 5432 -U privado -d privado -c "ALTER TABLE anchor_tests ADD COLUMN IF NOT EXISTS ponto_id TEXT;"

echo Colunas adicionadas com sucesso!

REM Verificar estrutura
psql -h private_alpdb -p 5432 -U privado -d privado -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'anchor_points' ORDER BY ordinal_position;"

pause