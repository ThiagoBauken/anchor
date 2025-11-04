const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('Testando conexão com o banco de dados...\n');
    
    // Teste 1: Verificar conexão
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');
    
    // Teste 2: Contar empresas
    const companyCount = await prisma.company.count();
    console.log(`📊 Total de empresas: ${companyCount}`);
    
    // Teste 3: Contar usuários
    const userCount = await prisma.user.count();
    console.log(`👥 Total de usuários: ${userCount}`);
    
    // Teste 4: Contar projetos
    const projectCount = await prisma.project.count();
    console.log(`📁 Total de projetos: ${projectCount}`);
    
    // Teste 5: Contar pontos de ancoragem
    const anchorPointCount = await prisma.anchorPoint.count();
    console.log(`⚓ Total de pontos de ancoragem: ${anchorPointCount}`);
    
    // Teste 6: Contar testes de ancoragem
    const anchorTestCount = await prisma.anchorTest.count();
    console.log(`🧪 Total de testes de ancoragem: ${anchorTestCount}`);
    
    // Teste 7: Verificar tabelas do sistema
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('\n📋 Tabelas no banco de dados:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));
    
    console.log('\n✅ Todos os testes passaram! Banco de dados está completo e funcional.');
    
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();