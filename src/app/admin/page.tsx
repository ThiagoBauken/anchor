"use client"

import { useState, useEffect } from 'react'
import { useOfflineAuthSafe } from '@/context/OfflineAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import DashboardMetrics from '@/components/admin/dashboard-metrics'
import BackupManagement from '@/components/admin/backup-management'
import { 
  Users, 
  Building2, 
  CreditCard, 
  Activity, 
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Shield,
  Settings,
  Database,
  BarChart3,
  UserPlus,
  Edit,
  Trash2,
  Pause,
  Play,
  HardDrive
} from 'lucide-react'
import type { SystemStats, AdminActivity, Company, User, SubscriptionPlan } from '@/types'

export default function AdminDashboard() {
  const { currentUser, isAuthenticated } = useOfflineAuthSafe()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [activities, setActivities] = useState<AdminActivity[]>([])
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false)
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: '',
    maxUsers: '',
    maxProjects: '',
    maxStorage: '',
    features: ''
  })

  // Check if user is super admin
  const isSuperAdmin = (currentUser?.role as string) === 'superadmin'

  useEffect(() => {
    if (!isAuthenticated || !isSuperAdmin) {
      return
    }
    loadDashboardData()
  }, [isAuthenticated, isSuperAdmin])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load system statistics
      const statsResponse = await fetch('/api/admin/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Load companies
      const companiesResponse = await fetch('/api/admin/companies')
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json()
        setCompanies(companiesData)
      }

      // Load users
      const usersResponse = await fetch('/api/admin/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }

      // Load activities
      const activitiesResponse = await fetch('/api/admin/activities')
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        setActivities(activitiesData)
      }

      // Load subscription plans
      const plansResponse = await fetch('/api/admin/subscription-plans')
      if (plansResponse.ok) {
        const plansData = await plansResponse.json()
        setSubscriptionPlans(plansData)
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do dashboard.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSuspendCompany = async (companyId: string, suspend: boolean) => {
    try {
      const response = await fetch(`/api/admin/companies/${companyId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspend })
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: `Empresa ${suspend ? 'suspensa' : 'ativada'} com sucesso.`
        })
        loadDashboardData()
      }
    } catch (error) {
      console.error('Error suspending company:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status da empresa.',
        variant: 'destructive'
      })
    }
  }

  const handleCreateSubscriptionPlan = async () => {
    try {
      const response = await fetch('/api/admin/subscription-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPlan,
          price: parseFloat(newPlan.price),
          maxUsers: parseInt(newPlan.maxUsers),
          maxProjects: parseInt(newPlan.maxProjects),
          maxStorage: parseInt(newPlan.maxStorage),
          features: newPlan.features.split(',').map(f => f.trim())
        })
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Plano de assinatura criado com sucesso.'
        })
        setNewPlan({
          name: '',
          price: '',
          maxUsers: '',
          maxProjects: '',
          maxStorage: '',
          features: ''
        })
        loadDashboardData()
      }
    } catch (error) {
      console.error('Error creating plan:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao criar plano de assinatura.',
        variant: 'destructive'
      })
    }
  }

  // Redirect if not super admin
  if (!isAuthenticated || !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Acesso Negado
            </CardTitle>
            <CardDescription>
              Você precisa ser um super administrador para acessar esta página.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Carregando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Super Admin</h1>
          <p className="text-muted-foreground">
            Gerencie todas as contas e configurações do sistema
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Shield className="h-4 w-4" />
          Super Admin
        </Badge>
      </div>

      {/* System Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCompanies || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeCompanies || 0} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats?.monthlyRevenue?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeSubscriptions || 0} assinaturas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProjects || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalPoints || 0} pontos de ancoragem
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="companies">Empresas</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="subscriptions">Planos</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="activities">Atividades</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <DashboardMetrics />
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <BackupManagement />
        </TabsContent>

        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Empresas</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as empresas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>
                        <Badge variant={company.subscriptionPlan === 'trial' ? 'secondary' : 'default'}>
                          {company.subscriptionPlan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={company.isActive ? 'default' : 'destructive'}>
                          {company.isActive ? 'Ativa' : 'Suspensa'}
                        </Badge>
                      </TableCell>
                      <TableCell>{company.usersCount || 0}</TableCell>
                      <TableCell>{company.createdAt ? new Date(company.createdAt).toLocaleDateString('pt-BR') : '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedCompany(company)
                              setIsEditCompanyOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={company.isActive ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleSuspendCompany(company.id, !!company.isActive)}
                          >
                            {company.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Usuários</CardTitle>
              <CardDescription>
                Visualize todos os usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.company?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          user.role === 'superadmin' ? 'default' :
                          user.role === 'company_admin' ? 'default' :
                          user.role === 'team_admin' ? 'secondary' :
                          'outline'
                        }>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.active ? 'default' : 'destructive'}>
                          {user.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Planos de Assinatura</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie os planos disponíveis no sistema
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Plano
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Criar Novo Plano</DialogTitle>
                  <DialogDescription>
                    Configure um novo plano de assinatura
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome do Plano</Label>
                    <Input
                      id="name"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      placeholder="Ex: Premium"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Preço Mensal (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newPlan.price}
                      onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                      placeholder="99.90"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maxUsers">Máximo de Usuários</Label>
                    <Input
                      id="maxUsers"
                      type="number"
                      value={newPlan.maxUsers}
                      onChange={(e) => setNewPlan({ ...newPlan, maxUsers: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maxProjects">Máximo de Projetos</Label>
                    <Input
                      id="maxProjects"
                      type="number"
                      value={newPlan.maxProjects}
                      onChange={(e) => setNewPlan({ ...newPlan, maxProjects: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maxStorage">Armazenamento (GB)</Label>
                    <Input
                      id="maxStorage"
                      type="number"
                      value={newPlan.maxStorage}
                      onChange={(e) => setNewPlan({ ...newPlan, maxStorage: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="features">Recursos (separados por vírgula)</Label>
                    <Textarea
                      id="features"
                      value={newPlan.features}
                      onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                      placeholder="Suporte 24/7, Relatórios avançados, API"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancelar</Button>
                  <Button onClick={handleCreateSubscriptionPlan}>Criar Plano</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead>Projetos</TableHead>
                    <TableHead>Armazenamento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>R$ {plan.price.toFixed(2)}/mês</TableCell>
                      <TableCell>{plan.limits.maxUsers}</TableCell>
                      <TableCell>{plan.limits.maxProjects}</TableCell>
                      <TableCell>{plan.limits.maxStorage} GB</TableCell>
                      <TableCell>
                        <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                          {plan.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Log de Atividades</CardTitle>
              <CardDescription>
                Monitore todas as atividades administrativas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Administrador</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Alvo</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{new Date(activity.timestamp).toLocaleString('pt-BR')}</TableCell>
                      <TableCell>{activity.adminName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{activity.action}</Badge>
                      </TableCell>
                      <TableCell>{activity.targetName || activity.targetId}</TableCell>
                      <TableCell>{activity.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Status do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Armazenamento Total:</span>
                  <span>{stats?.storageUsed || 0} GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Total de Testes:</span>
                  <span>{stats?.totalTests || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Empresas em Trial:</span>
                  <span>{stats?.trialCompanies || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  <Activity className="h-4 w-4 mr-2" />
                  Limpar Logs Antigos
                </Button>
                <Button variant="outline" className="w-full">
                  <Database className="h-4 w-4 mr-2" />
                  Backup do Sistema
                </Button>
                <Button variant="destructive" className="w-full">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Modo Manutenção
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Company Dialog */}
      <Dialog open={isEditCompanyOpen} onOpenChange={setIsEditCompanyOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Modifique as informações da empresa selecionada
            </DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome da Empresa</Label>
                <Input value={selectedCompany.name} readOnly />
              </div>
              <div className="grid gap-2">
                <Label>Plano de Assinatura</Label>
                <Select defaultValue={selectedCompany.subscriptionPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Notas Administrativas</Label>
                <Textarea 
                  placeholder="Adicione notas sobre esta empresa..."
                  defaultValue={selectedCompany.notes || ''}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditCompanyOpen(false)}>
              Cancelar
            </Button>
            <Button>Salvar Alterações</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}