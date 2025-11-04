// Check specific user role
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

async function checkUserRole() {
  const prisma = new PrismaClient()

  try {
    // Get the user who logged in (admin@admin.com)
    const user = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' },
      include: { company: true }
    })

    if (!user) {
      console.log('❌ Usuário admin@admin.com não encontrado!')
      return
    }

    console.log('\n📋 Informações do Usuário:\n')
    console.log(`Name: ${user.name}`)
    console.log(`Email: ${user.email}`)
    console.log(`Role: ${user.role}`)
    console.log(`Active: ${user.active}`)
    console.log(`Company: ${user.company?.name || 'N/A'}`)
    console.log(`Company Type: ${user.company?.name?.toLowerCase().includes('alpinist') ? 'Alpinista' : 'Administradora'}`)
    console.log()

    // Check permissions
    console.log('🔐 Permissões:')
    console.log(`✓ Pode ver Equipes: SIM (todos podem)`)
    console.log(`✓ Pode ver Marketplace: ${user.role === 'company_admin' || user.role === 'superadmin' ? 'SIM' : 'NÃO'}`)
    console.log(`✓ Pode editar mapas: ${user.role === 'team_admin' || user.role === 'superadmin' ? 'SIM' : 'NÃO'}`)
    console.log(`✓ Pode criar projetos: ${user.role !== 'technician' ? 'SIM' : 'NÃO'}`)
    console.log()

    if (user.role !== 'company_admin' && user.role !== 'superadmin') {
      console.log('⚠️  PROBLEMA ENCONTRADO!')
      console.log(`O usuário tem role "${user.role}", mas deveria ser "company_admin" para acessar o Marketplace.`)
      console.log()
      console.log('🔧 Solução: Vou atualizar o role para company_admin...')

      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'company_admin' }
      })

      console.log('✅ Role atualizado para company_admin!')
      console.log('🔄 Faça logout e login novamente para aplicar as mudanças.')
    } else {
      console.log('✅ Role está correto! O usuário deve ter acesso ao Marketplace.')
      console.log('💡 Se ainda não vê o Marketplace, limpe o cache do browser (Ctrl+Shift+Delete).')
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserRole()
