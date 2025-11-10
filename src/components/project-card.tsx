"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, Globe } from 'lucide-react';
import Image from 'next/image';
import type { User } from '@/types';

interface Project {
  id: string;
  name: string;
  floorPlanImages?: string[];
  companyId: string;
}

interface ProjectCardProps {
  project: Project;
  isSelected: boolean;
  currentUser: User | null;
  pointCounts: { active: number; archived: number };
  onSelect: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onPublicSettings: (project: { id: string; name: string }) => void;
}

export function ProjectCard({
  project,
  isSelected,
  currentUser,
  pointCounts,
  onSelect,
  onEdit,
  onDelete,
  onPublicSettings
}: ProjectCardProps) {
  const canManage = currentUser?.role === 'superadmin' ||
                    currentUser?.role === 'company_admin' ||
                    currentUser?.role === 'team_admin';

  const showBadge = currentUser?.role === 'team_admin' || currentUser?.role === 'technician';

  return (
    <div className="flex items-center justify-between p-3 rounded-md transition-colors group">
      <div
        className="flex items-center gap-3 flex-grow cursor-pointer"
        onClick={() => onSelect(project)}
      >
        <div className={`p-1 rounded-md transition-colors ${isSelected ? 'bg-primary/20' : 'group-hover:bg-muted'}`}>
          <Image
            src={project.floorPlanImages?.[0] || 'https://placehold.co/80x60.png'}
            alt={`Planta de ${project.name}`}
            width={60}
            height={45}
            className="rounded-sm object-cover bg-muted"
          />
        </div>
        <div className="flex-grow">
          <div className="flex items-center gap-2">
            <span className={`font-medium transition-colors ${isSelected ? 'text-primary' : ''}`}>
              {project.name}
            </span>
            {showBadge && (
              <Badge
                variant={project.companyId === currentUser.companyId ? 'default' : 'secondary'}
                className="text-xs"
              >
                {project.companyId === currentUser.companyId ? 'Próprio' : 'Atribuído'}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            <span>{pointCounts.active || 0} pontos ativos</span>
            {canManage && pointCounts.archived > 0 && (
              <span className="ml-2 text-yellow-600">{pointCounts.archived} arquivados</span>
            )}
          </div>
        </div>
      </div>
      {canManage && (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPublicSettings({ id: project.id, name: project.name })}
            title="Configurar Acesso Público"
          >
            <Globe className="h-4 w-4 text-violet-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(project)}
          >
            <Edit className="h-4 w-4 text-blue-600" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso marcará o projeto como excluído e ocultará todos os seus pontos e testes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(project.id)}>Continuar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
