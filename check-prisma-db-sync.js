const { PrismaClient } = require('@prisma/client');

async function checkDatabaseSync() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  console.log('🔍 Verificando sincronização Prisma <-> PostgreSQL\n');

  try {
    // 1. Verificar conexão
    console.log('📡 Testando conexão...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conectado ao banco!\n');

    // 2. Verificar tabelas críticas
    console.log('📊 Verificando tabelas...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'companies', 'projects', 'locations', 'anchor_points', 'anchor_tests')
      ORDER BY table_name;
    `;
    
    console.log('Tabelas encontradas:', tables.map(t => t.table_name).join(', '));

    // 3. Verificar colunas críticas
    console.log('\n🔍 Verificando colunas críticas...');
    
    const checkColumn = async (table, column) => {
      try {
        const result = await prisma.$queryRaw`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = ${table} 
          AND column_name = ${column}
        `;
        
        if (result.length > 0) {
          console.log(`✅ ${table}.${column}: ${result[0].data_type}`);
          return true;
        } else {
          console.log(`❌ ${table}.${column}: NÃO ENCONTRADA`);
          return false;
        }
      } catch (error) {
        console.log(`❌ ${table}.${column}: ERRO - ${error.message}`);
        return false;
      }
    };

    // Verificar colunas problemáticas
    const columnsToCheck = [
      ['users', 'password_hash'],
      ['users', 'companyId'],
      ['projects', 'floor_plan_images'],
      ['projects', 'companyId'],
      ['locations', 'markerShape'],
      ['locations', 'companyId'],
      ['anchor_points', 'numero_ponto'],
      ['anchor_points', 'project_id'],
    ];

    let allColumnsOk = true;
    for (const [table, column] of columnsToCheck) {
      const exists = await checkColumn(table, column);
      if (!exists) allColumnsOk = false;
    }

    // 4. Testar queries Prisma
    console.log('\n🧪 Testando queries Prisma...');
    
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Prisma user.count(): ${userCount}`);
    } catch (error) {
      console.log(`❌ Prisma user.count(): ${error.message}`);
    }

    try {
      const projectCount = await prisma.project.count();
      console.log(`✅ Prisma project.count(): ${projectCount}`);
    } catch (error) {
      console.log(`❌ Prisma project.count(): ${error.message}`);
    }

    try {
      const locationCount = await prisma.location.count();
      console.log(`✅ Prisma location.count(): ${locationCount}`);
    } catch (error) {
      console.log(`❌ Prisma location.count(): ${error.message}`);
    }

    // 5. Verificar versão do Prisma
    console.log('\n📦 Informações do Prisma:');
    const prismaVersion = require('@prisma/client/package.json').version;
    console.log(`Versão do @prisma/client: ${prismaVersion}`);
    
    // Resultado final
    console.log('\n' + '='.repeat(50));
    if (allColumnsOk) {
      console.log('✅ BANCO E PRISMA ESTÃO SINCRONIZADOS!');
    } else {
      console.log('❌ PROBLEMAS ENCONTRADOS!');
      console.log('\nSoluções:');
      console.log('1. Execute: npx prisma db push');
      console.log('2. Ou execute: node fix-database-schema.sql');
      console.log('3. Depois: npx prisma generate');
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('\n💡 Verifique se DATABASE_URL está configurado corretamente');
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseSync().catch(console.error);