'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Settings,
  Shield,
  Trash2,
  Edit,
  Award,
  Building2
} from 'lucide-react';
import TeamMembersManager from './team-members-manager';
import TeamPermissionsManager from './team-permissions-manager';
import TeamSettingsForm from './team-settings-form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { deleteTeam } from '@/app/actions/team-actions';

interface TeamDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: any;
  onUpdate: () => void;
  onDelete: () => void;
}

export default function TeamDetailsDialog({
  open,
  onOpenChange,
  team,
  onUpdate,
  onDelete
}: TeamDetailsDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('info');

  const handleDelete = async () => {
    try {
      const success = await deleteTeam(team.id);
      if (success) {
        onDelete();
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível desativar a equipe.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao desativar a equipe.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Users className="w-6 h-6 text-violet-600" />
                {team.name}
              </DialogTitle>
              <DialogDescription className="mt-2">
                Gerencie informações, membros e permissões desta equipe
              </DialogDescription>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Desativar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Desativar Equipe</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja desativar esta equipe? Esta ação pode ser revertida depois.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Desativar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </DialogHeader>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{team.members?.length || 0}</div>
              <p className="text-sm text-gray-600">Membros</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{team._count?.projectPermissions || 0}</div>
              <p className="text-sm text-gray-600">Projetos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-violet-600" />
              <div className="text-2xl font-bold">{team.certifications?.length || 0}</div>
              <p className="text-sm text-gray-600">Certificações</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">
              <Settings className="w-4 h-4 mr-2" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="w-4 h-4 mr-2" />
              Membros ({team.members?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <Shield className="w-4 h-4 mr-2" />
              Permissões
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="mt-6">
            <TeamSettingsForm team={team} onUpdate={onUpdate} />
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-6">
            <TeamMembersManager teamId={team.id} onUpdate={onUpdate} />
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="mt-6">
            <TeamPermissionsManager teamId={team.id} teamName={team.name} onUpdate={onUpdate} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
