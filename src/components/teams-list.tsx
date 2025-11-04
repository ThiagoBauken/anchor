'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ChevronRight, Award, Shield, Eye } from 'lucide-react';
import Image from 'next/image';

interface TeamsListProps {
  teams: any[];
  loading: boolean;
  onViewTeam: (team: any) => void;
  onRefresh: () => void;
}

export default function TeamsList({ teams, loading, onViewTeam, onRefresh }: TeamsListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="w-16 h-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhuma equipe cadastrada
        </h3>
        <p className="text-gray-600 mb-6">
          Comece criando sua primeira equipe de alpinismo
        </p>
        <Button onClick={onRefresh} variant="outline">
          Atualizar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {teams.map(team => (
        <Card
          key={team.id}
          className="hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => onViewTeam(team)}
        >
          <div className="flex items-center gap-4 p-4">
            {/* Team Logo */}
            <div className="relative w-16 h-16 rounded-lg bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center overflow-hidden">
              {team.logo ? (
                <Image
                  src={team.logo}
                  alt={team.name}
                  width={64}
                  height={64}
                  className="object-cover"
                />
              ) : (
                <Users className="w-8 h-8 text-violet-600" />
              )}
            </div>

            {/* Team Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {team.name}
                </h3>
                {!team.active && (
                  <Badge variant="secondary" className="text-xs">
                    Inativa
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {team.members?.length || 0} membros
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {team._count?.projectPermissions || 0} projetos
                </span>
                {team.certifications && team.certifications.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    {team.certifications.length} certificações
                  </span>
                )}
              </div>

              {/* Additional Info */}
              {(team.email || team.phone || team.cnpj) && (
                <div className="mt-2 text-xs text-gray-500 flex gap-3">
                  {team.email && <span>📧 {team.email}</span>}
                  {team.phone && <span>📞 {team.phone}</span>}
                  {team.cnpj && <span>🏢 CNPJ: {team.cnpj}</span>}
                </div>
              )}

              {/* Insurance Info */}
              {team.insurancePolicy && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Seguro: {team.insurancePolicy}
                    {team.insuranceExpiry && (
                      <span className="ml-1">
                        (válido até {new Date(team.insuranceExpiry).toLocaleDateString('pt-BR')})
                      </span>
                    )}
                  </Badge>
                </div>
              )}
            </div>

            {/* Action Button */}
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 group-hover:bg-violet-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-violet-600" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
