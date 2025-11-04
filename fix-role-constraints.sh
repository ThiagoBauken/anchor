#!/bin/bash
# Corrigir role constraints no PostgreSQL

printf 'private_alpdb:5432:privado:privado:privado12!\n' >> ~/.pgpass
chmod 600 ~/.pgpass

psql -h private_alpdb -p 5432 -U privado -d privado << 'EOF'

-- Remover constraint de role antigo se existir
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_role_check";

-- Adicionar constraint correto (apenas admin e user)
ALTER TABLE "User" ADD CONSTRAINT "User_role_check" CHECK (role IN ('admin', 'user'));

-- Corrigir dados existentes com super_admin para admin
UPDATE "User" SET role = 'admin' WHERE role = 'super_admin';

-- Verificar constraints atuais
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%role%';

-- Verificar usuários
SELECT id, name, role FROM "User";

\echo '✅ Role constraints corrigidos!'

EOF