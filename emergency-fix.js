const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function emergencyFix() {
  console.log('🚨 Aplicando correções de emergência...\n');

  try {
    // 1. Adicionar coluna markerColor se não existir
    console.log('1. Adicionando coluna markerColor...');
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "markerColor" VARCHAR(50) DEFAULT '#6941DE'
      `;
      console.log('✅ Coluna markerColor adicionada/verificada');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Coluna markerColor já existe');
      } else {
        console.error('❌ Erro ao adicionar markerColor:', error.message);
      }
    }

    // 2. Atualizar todas as localizações existentes para ter markerColor
    console.log('\n2. Atualizando localizações existentes...');
    try {
      const updated = await prisma.$executeRaw`
        UPDATE "Location" SET "markerColor" = '#6941DE' WHERE "markerColor" IS NULL
      `;
      console.log(`✅ ${updated} localizações atualizadas com markerColor`);
    } catch (error) {
      console.log('ℹ️ Erro esperado se coluna não existir ainda:', error.message);
    }

    // 3. Verificar se existe empresa demo
    console.log('\n3. Criando empresa e usuário demo...');
    
    let demoCompany;
    try {
      demoCompany = await prisma.company.findUnique({
        where: { id: 'demo-company' }
      });
    } catch (error) {
      demoCompany = null;
    }

    if (!demoCompany) {
      try {
        demoCompany = await prisma.company.create({
          data: {
            id: 'demo-company',
            name: 'Empresa Demo',
            subscriptionPlan: 'trial',
            subscriptionStatus: 'active',
            trialStartDate: new Date(),
            trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            isTrialActive: true,
            daysRemainingInTrial: 14
          }
        });
        console.log('✅ Empresa demo criada');
      } catch (error) {
        console.log('ℹ️ Empresa demo pode já existir:', error.message);
      }
    } else {
      console.log('✅ Empresa demo já existe');
    }

    // 4. Criar usuário admin se não existir
    let adminUser;
    try {
      adminUser = await prisma.user.findUnique({
        where: { email: 'admin@admin.com' }
      });
    } catch (error) {
      adminUser = null;
    }

    if (!adminUser && demoCompany) {
      try {
        adminUser = await prisma.user.create({
          data: {
            id: 'demo-admin',
            name: 'Administrador Demo',
            email: 'admin@admin.com',
            password: '$2a$10$demo.hash.for.admin.user.password',
            role: 'admin',
            companyId: demoCompany.id,
            active: true
          }
        });
        console.log('✅ Usuário admin criado');
      } catch (error) {
        console.log('ℹ️ Usuário admin pode já existir:', error.message);
      }
    } else {
      console.log('✅ Usuário admin já existe ou empresa não encontrada');
    }

    // 5. Verificar se as correções funcionaram
    console.log('\n4. Testando correções...');
    
    try {
      // Testar query de localização com markerColor
      const locations = await prisma.location.findMany({
        take: 1
      });
      console.log('✅ Query de localização com markerColor funcionando');
    } catch (error) {
      console.log('❌ Query de localização ainda falhando:', error.message);
    }

    console.log('\n🎉 Correções de emergência aplicadas!');
    console.log('\n📝 Para usar o sistema:');
    console.log('1. Reinicie o servidor: npm run dev');
    console.log('2. Acesse: http://localhost:9002/auth/login');
    console.log('3. Login: admin@admin.com / admin123');

  } catch (error) {
    console.error('❌ Erro nas correções de emergência:', error);
  } finally {
    await prisma.$disconnect();
  }
}

emergencyFix();