'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useOfflineData } from '@/context/OfflineDataContext';
import { FacadeInspectionManager } from './facade-inspection-manager';
import { Building2 } from 'lucide-react';

export function FacadesTab() {
  const { currentProject, currentUser } = useOfflineData();

  if (!currentProject) {
    return (
      <Card className="mt-4 bg-card/90 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Selecione um projeto para gerenciar inspeções de fachadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser) {
    return (
      <Card className="mt-4 bg-destructive/10 border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">⚠️ Usuário não autenticado</CardTitle>
          <CardDescription>
            Você precisa estar logado para gerenciar inspeções de fachadas. Faça login e tente novamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Verifique se você está logado corretamente. Se o problema persistir, limpe o cache do navegador e faça login novamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  const canEdit = currentUser.role === 'superadmin' || currentUser.role === 'company_admin' || currentUser.role === 'team_admin';

  return (
    <div className="space-y-6">
      <Card className="bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>🏢 Inspeção de Fachadas</CardTitle>
              <CardDescription>
                Gerencie inspeções de fachadas, marque patologias (fissuras, infiltrações, etc.) e gere laudos técnicos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FacadeInspectionManager
            projectId={currentProject.id}
            companyId={currentUser.companyId || ''}
            currentUserId={currentUser.id}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
