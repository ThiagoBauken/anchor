'use server'

import { prisma } from '@/lib/prisma'

/**
 * Get all climbing companies (companies where primary user is team_admin)
 * This is used by administradoras to browse available service providers
 */
export async function getClimbingCompanies() {
  try {
    if (!prisma) {
      console.warn('Database not available')
      return []
    }

    // Get all companies that have at least one team_admin user
    // These are climbing companies/service providers
    const companies = await prisma.company.findMany({
      where: {
        users: {
          some: {
            role: 'team_admin',
            active: true
          }
        },
        isActive: true
      },
      include: {
        users: {
          where: {
            role: 'team_admin',
            active: true
          },
          take: 1, // Get the primary contact
          orderBy: {
            createdAt: 'asc'
          }
        },
        teams: {
          where: {
            active: true
          },
          include: {
            members: {
              take: 5,
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    phone: true
                  }
                }
              }
            },
            projectPermissions: {
              select: {
                projectId: true
              }
            }
          }
        },
        projects: {
          where: {
            deleted: false
          },
          select: {
            id: true,
            name: true
          },
          take: 5
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return companies.map(company => ({
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      cnpj: company.cnpj,
      createdAt: company.createdAt?.toISOString(),
      lastActivity: company.lastActivity?.toISOString(),
      notes: company.notes,

      // Primary contact (first team_admin user)
      primaryContact: company.users[0] ? {
        name: company.users[0].name,
        email: company.users[0].email,
        phone: company.users[0].phone
      } : null,

      // Teams info
      teams: company.teams.map(team => ({
        id: team.id,
        name: team.name,
        cnpj: team.cnpj,
        email: team.email,
        phone: team.phone,
        address: team.address,
        certifications: team.certifications,
        insurancePolicy: team.insurancePolicy,
        insuranceExpiry: team.insuranceExpiry?.toISOString(),
        insuranceValue: team.insuranceValue?.toString(),
        managerName: team.managerName,
        managerPhone: team.managerPhone,
        managerEmail: team.managerEmail,
        membersCount: team.members.length,
        projectsCount: team.projectPermissions.length
      })),

      // Company stats
      projectsCount: company.projects.length,
      usersCount: company.users.length  // ← CORRIGIDO: Contar usuários reais ao invés do campo denormalizado
    }))
  } catch (error) {
    console.error('Error fetching climbing companies:', error)
    return []
  }
}
