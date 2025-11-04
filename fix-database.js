const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Verificando e corrigindo estrutura do banco de dados...\n');

  try {
    // 1. Verificar se a coluna markerColor existe
    console.log('1. Verificando coluna markerColor...');
    
    try {
      await prisma.$queryRaw`
        SELECT "markerColor" FROM "Location" LIMIT 1
      `;
      console.log('✅ Coluna markerColor já existe\n');
    } catch (error) {
      if (error.code === 'P2022' || error.message.includes('markerColor')) {
        console.log('❌ Coluna markerColor não existe. Adicionando...');
        
        await prisma.$executeRaw`
          ALTER TABLE "Location" ADD COLUMN "markerColor" VARCHAR(50) DEFAULT '#6941DE'
        `;
        
        console.log('✅ Coluna markerColor adicionada com sucesso\n');
      } else {
        throw error;
      }
    }

    // 2. Verificar se existe empresa demo
    console.log('2. Verificando empresa demo...');
    let demoCompany = await prisma.company.findUnique({
      where: { id: 'demo-company' }
    });

    if (!demoCompany) {
      console.log('❌ Empresa demo não existe. Criando...');
      
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialStartDate.getDate() + 14);

      demoCompany = await prisma.company.create({
        data: {
          id: 'demo-company',
          name: 'Empresa Demo',
          subscriptionPlan: 'trial',
          subscriptionStatus: 'active',
          trialStartDate: trialStartDate,
          trialEndDate: trialEndDate,
          isTrialActive: true,
          daysRemainingInTrial: 14
        }
      });
      console.log('✅ Empresa demo criada\n');
    } else {
      console.log('✅ Empresa demo já existe\n');
    }

    // 3. Verificar usuário admin
    console.log('3. Verificando usuário admin...');
    const adminEmail = 'admin@admin.com';
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!adminUser) {
      console.log('❌ Usuário admin não existe. Criando...');
      
      // Usar bcrypt se disponível, senão usar hash simples
      let hashedPassword;
      try {
        const bcrypt = require('bcryptjs');
        hashedPassword = await bcrypt.hash('admin123', 10);
      } catch (e) {
        hashedPassword = '$2a$10$demo.hash.for.admin.user.password';
      }
      
      adminUser = await prisma.user.create({
        data: {
          id: 'demo-admin',
          name: 'Administrador Demo',
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          companyId: demoCompany.id,
          active: true
        }
      });
      console.log('✅ Usuário admin criado\n');
    } else {
      console.log('✅ Usuário admin já existe\n');
    }

    // 4. Criar projeto e localização de exemplo
    console.log('4. Verificando dados de exemplo...');
    let sampleProject = await prisma.project.findFirst({
      where: { companyId: demoCompany.id }
    });

    if (!sampleProject) {
      console.log('❌ Projeto demo não existe. Criando...');
      sampleProject = await prisma.project.create({
        data: {
          name: 'Projeto Demo',
          description: 'Projeto de demonstração',
          companyId: demoCompany.id,
          createdByUserId: adminUser.id,
          floorPlanImages: []
        }
      });
      console.log('✅ Projeto demo criado');
    } else {
      console.log('✅ Projeto demo já existe');
    }

    let sampleLocation = await prisma.location.findFirst({
      where: { companyId: demoCompany.id }
    });

    if (!sampleLocation) {
      console.log('❌ Localização demo não existe. Criando...');
      sampleLocation = await prisma.location.create({
        data: {
          name: 'Localização Demo',
          companyId: demoCompany.id,
          projectId: sampleProject.id,
          markerShape: 'circle',
          markerColor: '#6941DE'
        }
      });
      console.log('✅ Localização demo criada');
    } else {
      console.log('✅ Localização demo já existe');
    }

    console.log('\n🎉 Banco de dados corrigido com sucesso!');
    console.log('📝 Credenciais de acesso:');
    console.log('   Email: admin@admin.com');
    console.log('   Senha: admin123');

  } catch (error) {
    console.error('❌ Erro ao corrigir banco de dados:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });