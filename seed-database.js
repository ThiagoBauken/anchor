const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Check if demo company exists
    let demoCompany = await prisma.company.findUnique({
      where: { id: 'demo-company' }
    });

    if (!demoCompany) {
      console.log('Creating demo company...');
      
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
      console.log('✅ Demo company created');
    } else {
      console.log('Demo company already exists');
    }

    // Check if admin user exists
    const adminEmail = 'admin@admin.com';
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!adminUser) {
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
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
      console.log('✅ Admin user created');
    } else {
      console.log('Admin user already exists');
    }

    // Create a sample project
    let sampleProject = await prisma.project.findFirst({
      where: { companyId: demoCompany.id }
    });

    if (!sampleProject) {
      console.log('Creating sample project...');
      sampleProject = await prisma.project.create({
        data: {
          name: 'Projeto Demo',
          description: 'Projeto de demonstração',
          companyId: demoCompany.id,
          userId: adminUser.id
        }
      });
      console.log('✅ Sample project created');
    }

    // Create a sample location
    let sampleLocation = await prisma.location.findFirst({
      where: { companyId: demoCompany.id }
    });

    if (!sampleLocation) {
      console.log('Creating sample location...');
      sampleLocation = await prisma.location.create({
        data: {
          name: 'Localização Demo',
          companyId: demoCompany.id,
          projectId: sampleProject.id,
          markerColor: '#6941DE'
        }
      });
      console.log('✅ Sample location created');
    }

    console.log('🎉 Database seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
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