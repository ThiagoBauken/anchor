const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function testDatabaseConnection() {
  const prisma = new PrismaClient({
    log: ['error', 'warn', 'info'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('🔄 Testando conexão com banco de dados...');
    
    // Test basic connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Conexão com banco estabelecida!');
    
    // Check if main tables exist
    console.log('\n🔍 Verificando estrutura do banco...');
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log('📊 Tabelas encontradas:', tables.map(t => t.table_name));
    
    // Check for required columns
    console.log('\n🔍 Verificando colunas críticas...');
    
    const checkColumns = async (table, columns) => {
      try {
        const result = await prisma.$queryRaw`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = ${table} 
          AND column_name = ANY(${columns});
        `;
        return result.map(r => r.column_name);
      } catch (error) {
        console.log(`❌ Erro ao verificar tabela ${table}:`, error.message);
        return [];
      }
    };
    
    const criticalColumns = {
      'locations': ['markerShape'],
      'projects': ['floor_plan_images'],
      'users': ['password_hash'],
      'anchor_points': ['numero_ponto']
    };
    
    let missingColumns = [];
    
    for (const [table, columns] of Object.entries(criticalColumns)) {
      const foundColumns = await checkColumns(table, columns);
      const missing = columns.filter(col => !foundColumns.includes(col));
      
      if (missing.length > 0) {
        console.log(`❌ ${table}: faltando colunas ${missing.join(', ')}`);
        missingColumns.push(...missing.map(col => `${table}.${col}`));
      } else {
        console.log(`✅ ${table}: todas as colunas necessárias presentes`);
      }
    }
    
    if (missingColumns.length > 0) {
      console.log('\n⚠️  Colunas faltando encontradas. Execute o script de correção:');
      console.log('   psql $DATABASE_URL -f fix-database-schema.sql');
      return false;
    } else {
      console.log('\n✅ Estrutura do banco está correta!');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    console.error('💡 Verifique:');
    console.error('   - DATABASE_URL está configurado corretamente');
    console.error('   - PostgreSQL está rodando');
    console.error('   - Credenciais estão corretas');
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function runDatabaseFix() {
  console.log('\n🔧 Executando script de correção...');
  
  const prisma = new PrismaClient();
  try {
    const sqlScript = fs.readFileSync(path.join(__dirname, 'fix-database-schema.sql'), 'utf8');
    
    // Split script into statements and execute
    const statements = sqlScript.split(/;\s*\n/).filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log('✅ Executado:', statement.substring(0, 50) + '...');
        } catch (error) {
          if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
            console.log('⚠️  Aviso:', error.message);
          }
        }
      }
    }
    
    console.log('\n✅ Script de correção executado!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao executar script:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 Diagnóstico e Correção do Banco de Dados\n');
  
  // Test connection first
  const isConnected = await testDatabaseConnection();
  
  if (!isConnected) {
    process.exit(1);
  }
  
  // Ask if user wants to run the fix
  console.log('\n❓ Deseja executar o script de correção automaticamente? (y/n)');
  
  // For automation, we'll run it automatically
  const shouldFix = true; // Change to false if you want manual confirmation
  
  if (shouldFix) {
    const fixed = await runDatabaseFix();
    
    if (fixed) {
      console.log('\n🎉 Banco de dados corrigido com sucesso!');
      console.log('💡 Reinicie a aplicação para aplicar as mudanças.');
    } else {
      console.log('\n❌ Falha na correção. Verifique os logs acima.');
      process.exit(1);
    }
  } else {
    console.log('\n💡 Execute manualmente: psql $DATABASE_URL -f fix-database-schema.sql');
  }
}

main().catch(console.error);