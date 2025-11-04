const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const cuid = require('cuid');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  console.log('🔍 Checking for superadmin user...');

  try {
    // Check if superadmin exists
    const superadminEmail = 'superadmin@anchor.com';
    let superadmin = await prisma.user.findUnique({
      where: { email: superadminEmail }
    });

    if (superadmin) {
      console.log('✅ Superadmin already exists:');
      console.log('   Email:', superadminEmail);
      console.log('   Role:', superadmin.role);
      return;
    }

    // Get or create a company for superadmin
    let company = await prisma.company.findFirst();

    if (!company) {
      console.log('📦 Creating company for superadmin...');
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialStartDate.getDate() + 365); // 1 year

      company = await prisma.company.create({
        data: {
          name: 'AnchorView Admin',
          subscriptionPlan: 'enterprise',
          subscriptionStatus: 'active',
          trialStartDate: trialStartDate,
          trialEndDate: trialEndDate,
          isTrialActive: false,
          daysRemainingInTrial: 0
        }
      });
    }

    // Create superadmin user
    console.log('👤 Creating superadmin user...');
    const hashedPassword = await bcrypt.hash('super123', 10);
    const userId = cuid();

    console.log('Generated user ID:', userId);
    console.log('Company ID:', company.id);

    superadmin = await prisma.user.create({
      data: {
        id: userId,
        name: 'Super Admin',
        email: superadminEmail,
        password: hashedPassword,
        role: 'superadmin',
        companyId: company.id,
        active: true
      },
      include: {
        company: true
      }
    });

    console.log('');
    console.log('✅ Superadmin created successfully!');
    console.log('');
    console.log('📝 Login credentials:');
    console.log('   Email: superadmin@anchor.com');
    console.log('   Password: super123');
    console.log('   Role: superadmin');
    console.log('');
    console.log('⚠️  Change the password after first login!');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating superadmin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
