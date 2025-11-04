'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, X } from 'lucide-react'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { useOfflineAuthSafe } from '@/context/OfflineAuthContext'
import { getProjectInvitations, acceptProjectInvitation, rejectProjectInvitation } from '@/app/actions/invitation-actions'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface ProjectInvitation {
  id: string
  title: string
  message: string
  data: {
    projectId: string
    projectName: string
    inviterName: string
    inviterCompany: string
    message?: string
    createdAt: string
  }
  createdAt: string
}

export function ProjectInvitationsPopover() {
  const { currentUser } = useOfflineAuthSafe()
  const { toast } = useToast()
  const router = useRouter()
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [processingInvite, setProcessingInvite] = useState<string | null>(null)

  useEffect(() => {
    if (currentUser?.id) {
      loadInvitations()
    }
  }, [currentUser?.id])

  async function loadInvitations() {
    if (!currentUser?.id) return

    setIsLoading(true)
    try {
      const data = await getProjectInvitations(currentUser.id)
      setInvitations(data as ProjectInvitation[])
    } catch (error) {
      console.error('Error loading invitations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAccept(invitationId: string) {
    if (!currentUser?.id) return

    setProcessingInvite(invitationId)
    try {
      const result = await acceptProjectInvitation(invitationId, currentUser.id)

      if (result.success) {
        toast({
          title: ' Convite Aceito!',
          description: result.message
        })

        // Remove from list
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId))

        // Refresh page to load new project
        setTimeout(() => {
          router.refresh()
        }, 1000)
      } else {
        toast({
          title: 'Erro',
          description: result.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao aceitar convite',
        variant: 'destructive'
      })
    } finally {
      setProcessingInvite(null)
    }
  }

  async function handleReject(invitationId: string) {
    if (!currentUser?.id) return

    setProcessingInvite(invitationId)
    try {
      const result = await rejectProjectInvitation(invitationId, currentUser.id)

      if (result.success) {
        toast({
          title: 'Convite Recusado',
          description: result.message
        })

        // Remove from list
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
      } else {
        toast({
          title: 'Erro',
          description: result.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error rejecting invitation:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao recusar convite',
        variant: 'destructive'
      })
    } finally {
      setProcessingInvite(null)
    }
  }

  // Only show for team_admin
  if (currentUser?.role !== 'team_admin') {
    return null
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {invitations.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {invitations.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-h-[600px] overflow-y-auto" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Convites de Projeto</h3>
            {invitations.length > 0 && (
              <Badge variant="secondary">{invitations.length}</Badge>
            )}
          </div>

          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Carregando convites...
            </div>
          )}

          {!isLoading && invitations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhum convite pendente</p>
            </div>
          )}

          {!isLoading && invitations.length > 0 && (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <Card key={invitation.id} className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      {invitation.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {invitation.message}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-3">
                    <div className="text-xs space-y-1">
                      <p>
                        <span className="font-semibold">Projeto:</span>{' '}
                        {invitation.data.projectName}
                      </p>
                      <p>
                        <span className="font-semibold">De:</span>{' '}
                        {invitation.data.inviterCompany}
                      </p>
                      {invitation.data.message && (
                        <p className="text-muted-foreground italic mt-2">
                          "{invitation.data.message}"
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => handleAccept(invitation.id)}
                        disabled={processingInvite === invitation.id}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {processingInvite === invitation.id ? 'Aceitando...' : 'Aceitar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleReject(invitation.id)}
                        disabled={processingInvite === invitation.id}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Recusar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
