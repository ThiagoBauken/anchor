'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Building2, Phone, Mail, MapPin, Users, Calendar, Shield, FileText, ExternalLink, Send, AlertCircle } from 'lucide-react'
import { useOfflineAuthSafe } from '@/context/OfflineAuthContext'
import { useOfflineData } from '@/context/OfflineDataContext'
import { getClimbingCompanies } from '@/app/actions/marketplace-actions'
import { inviteCompanyToProject } from '@/app/actions/invitation-actions'
import { LoadingOverlay } from './ui/loading-spinner'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { useToast } from '@/hooks/use-toast'

interface ClimbingCompany {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  cnpj: string | null
  createdAt: string
  lastActivity: string | null
  notes: string | null
  primaryContact: {
    name: string
    email: string | null
    phone: string | null
  } | null
  teams: Array<{
    id: string
    name: string
    cnpj: string | null
    email: string | null
    phone: string | null
    address: string | null
    certifications: string[]
    insurancePolicy: string | null
    insuranceExpiry: string | null
    insuranceValue: string | null
    managerName: string | null
    managerPhone: string | null
    managerEmail: string | null
    membersCount: number
    projectsCount: number
  }>
  projectsCount: number
  usersCount: number
}

export function MarketplaceTab() {
  const { currentUser } = useOfflineAuthSafe()
  const { projects } = useOfflineData()
  const { toast } = useToast()
  const [companies, setCompanies] = useState<ClimbingCompany[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null)

  // Invitation dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<ClimbingCompany | null>(null)
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [isSendingInvite, setIsSendingInvite] = useState(false)

  useEffect(() => {
    loadCompanies()
  }, [])

  async function loadCompanies() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getClimbingCompanies()
      setCompanies(data)
    } catch (error) {
      console.error('Error loading climbing companies:', error)
      setError('Erro ao carregar empresas. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleInviteClick(company: ClimbingCompany) {
    setSelectedCompany(company)
    setSelectedProject('')
    setInviteMessage('')
    setInviteDialogOpen(true)
  }

  async function handleSendInvite() {
    if (!selectedProject || !selectedCompany || !currentUser) {
      toast({
        title: 'Erro',
        description: 'Selecione um projeto',
        variant: 'destructive'
      })
      return
    }

    setIsSendingInvite(true)
    try {
      const project = projects.find(p => p.id === selectedProject)
      if (!project) {
        throw new Error('Projeto não encontrado')
      }

      const result = await inviteCompanyToProject({
        projectId: selectedProject,
        projectName: project.name,
        targetCompanyId: selectedCompany.id,
        invitedBy: currentUser.id,
        message: inviteMessage
      })

      if (result.success) {
        toast({
          title: 'Convite Enviado!',
          description: result.message
        })
        setInviteDialogOpen(false)
        setSelectedProject('')
        setInviteMessage('')
      } else {
        toast({
          title: 'Erro',
          description: result.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error sending invite:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao enviar convite',
        variant: 'destructive'
      })
    } finally {
      setIsSendingInvite(false)
    }
  }

  // Only company_admin and superadmin can access marketplace
  if (currentUser?.role !== 'company_admin' && currentUser?.role !== 'superadmin') {
    return (
      <Card className="mt-4">
        <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Acesso Restrito</h3>
          <p className="text-muted-foreground mt-2">
            Apenas administradoras podem visualizar o marketplace de empresas.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <LoadingOverlay isLoading={isLoading} text="Carregando empresas de alpinismo...">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Marketplace de Empresas de Alpinismo</h2>
          <p className="text-muted-foreground mt-1">
            Encontre e contrate empresas especializadas em trabalhos em altura
          </p>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive">Erro ao Carregar</h3>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={loadCompanies}
                  >
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {companies.length === 0 && !isLoading && !error && (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhuma empresa de alpinismo cadastrada no momento.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {companies.map((company) => (
            <Card key={company.id} className="bg-card/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <CardTitle>{company.name}</CardTitle>
                      <Badge variant="secondary" className="ml-2">
                        Empresa de Alpinismo
                      </Badge>
                    </div>
                    {company.cnpj && (
                      <p className="text-sm text-muted-foreground mt-1">
                        CNPJ: {company.cnpj}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleInviteClick(company)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Convidar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedCompany(expandedCompany === company.id ? null : company.id)}
                    >
                      {expandedCompany === company.id ? 'Ocultar' : 'Ver Detalhes'}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {company.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{company.email}</span>
                    </div>
                  )}
                  {company.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{company.address}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{company.usersCount} membros</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{company.projectsCount} projetos</span>
                  </div>
                  {company.teams.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{company.teams.length} equipes</span>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {expandedCompany === company.id && (
                  <div className="border-t pt-4 mt-4 space-y-4">
                    {/* Primary Contact */}
                    {company.primaryContact && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Contato Principal
                        </h4>
                        <div className="bg-muted/50 p-3 rounded-md space-y-1">
                          <p className="text-sm font-medium">{company.primaryContact.name}</p>
                          {company.primaryContact.email && (
                            <p className="text-sm text-muted-foreground">{company.primaryContact.email}</p>
                          )}
                          {company.primaryContact.phone && (
                            <p className="text-sm text-muted-foreground">{company.primaryContact.phone}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Teams */}
                    {company.teams.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Equipes</h4>
                        <Accordion type="single" collapsible className="w-full">
                          {company.teams.map((team, index) => (
                            <AccordionItem key={team.id} value={`team-${index}`}>
                              <AccordionTrigger>
                                <div className="flex items-center gap-2">
                                  <span>{team.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {team.membersCount} membros
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="space-y-3 pl-4">
                                {team.cnpj && (
                                  <p className="text-sm">
                                    <span className="font-medium">CNPJ:</span> {team.cnpj}
                                  </p>
                                )}

                                {team.certifications.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium mb-1">Certificações:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {team.certifications.map((cert, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                          {cert}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {team.insurancePolicy && (
                                  <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded-md">
                                    <p className="text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-400">
                                      <Shield className="h-4 w-4" />
                                      Seguro Ativo
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Apólice: {team.insurancePolicy}
                                    </p>
                                    {team.insuranceValue && (
                                      <p className="text-xs text-muted-foreground">
                                        Valor: R$ {parseFloat(team.insuranceValue).toLocaleString('pt-BR')}
                                      </p>
                                    )}
                                    {team.insuranceExpiry && (
                                      <p className="text-xs text-muted-foreground">
                                        Validade: {new Date(team.insuranceExpiry).toLocaleDateString('pt-BR')}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {team.managerName && (
                                  <div>
                                    <p className="text-sm font-medium">Responsável:</p>
                                    <p className="text-sm text-muted-foreground">{team.managerName}</p>
                                    {team.managerEmail && (
                                      <p className="text-xs text-muted-foreground">{team.managerEmail}</p>
                                    )}
                                    {team.managerPhone && (
                                      <p className="text-xs text-muted-foreground">{team.managerPhone}</p>
                                    )}
                                  </div>
                                )}

                                <div className="flex gap-2 text-xs text-muted-foreground">
                                  <span>{team.projectsCount} projetos atribuídos</span>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}

                    {company.notes && (
                      <div>
                        <h4 className="font-semibold mb-2">Observações</h4>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                          {company.notes}
                        </p>
                      </div>
                    )}

                    {/* Contact Button */}
                    <div className="flex gap-2">
                      {company.email && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`mailto:${company.email}`}>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Email
                          </a>
                        </Button>
                      )}
                      {company.phone && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`tel:${company.phone.replace(/\D/g, '')}`}>
                            <Phone className="h-4 w-4 mr-2" />
                            Ligar
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Invitation Dialog */}
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Convidar Empresa para Projeto</DialogTitle>
              <DialogDescription>
                Convide {selectedCompany?.name} para trabalhar em um de seus projetos
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="project">Selecione o Projeto *</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Escolha um projeto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.filter(p => !p.deleted).map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem (opcional)</Label>
                <Textarea
                  id="message"
                  placeholder="Adicione uma mensagem personalizada..."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
                disabled={isSendingInvite}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendInvite}
                disabled={!selectedProject || isSendingInvite}
              >
                {isSendingInvite ? 'Enviando...' : 'Enviar Convite'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </LoadingOverlay>
  )
}
