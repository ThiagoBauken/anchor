'use client';

/**
 * Company Management Component
 *
 * Interface administrativa para gerenciar empresas:
 * - Visualizar lista de todas as empresas
 * - Criar novas empresas com configurações iniciais
 * - Editar informações das empresas
 * - Suspender/ativar empresas
 * - Visualizar estatísticas de uso
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cnpj: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string;
  isTrialActive: boolean;
  daysRemainingInTrial: number;
  isActive: boolean;
  usersCount: number;
  projectsCount: number;
  storageUsed: number;
  maxUsers: number | null;
  maxProjects: number | null;
  maxStorage: number | null;
  createdAt: string;
  _count?: {
    users: number;
    projects: number;
    teams: number;
  };
  subscriptions?: Array<{
    plan: {
      name: string;
      priceMonthly: number;
    };
  }>;
}

interface CompanyFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  cnpj: string;
  subscriptionPlan: string;
  maxUsers: number;
  maxProjects: number;
  maxStorage: number;
  trialDays: number;
}

export function CompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Form state
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    cnpj: '',
    subscriptionPlan: 'trial',
    maxUsers: 10,
    maxProjects: 5,
    maxStorage: 1024,
    trialDays: 30,
  });

  // Fetch companies
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/admin/companies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }

      const data = await response.json();
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Create company
  const handleCreateCompany = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create company');
      }

      setIsCreateModalOpen(false);
      resetForm();
      fetchCompanies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Update company
  const handleUpdateCompany = async () => {
    if (!selectedCompany) return;

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/admin/companies', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: selectedCompany.id,
          ...formData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update company');
      }

      setIsEditModalOpen(false);
      setSelectedCompany(null);
      resetForm();
      fetchCompanies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Suspend/activate company
  const handleToggleCompanyStatus = async (company: Company) => {
    if (!confirm(`Tem certeza que deseja ${company.isActive ? 'suspender' : 'ativar'} ${company.name}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (company.isActive) {
        // Suspend company
        const response = await fetch(`/api/admin/companies?id=${company.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to suspend company');
        }
      } else {
        // Reactivate company
        const response = await fetch('/api/admin/companies', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: company.id,
            isActive: true,
            subscriptionStatus: 'active'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to reactivate company');
        }
      }

      fetchCompanies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Open edit modal
  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      email: company.email || '',
      phone: company.phone || '',
      address: '',
      cnpj: company.cnpj || '',
      subscriptionPlan: company.subscriptionPlan,
      maxUsers: company.maxUsers || 10,
      maxProjects: company.maxProjects || 5,
      maxStorage: company.maxStorage || 1024,
      trialDays: company.daysRemainingInTrial || 30,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      cnpj: '',
      subscriptionPlan: 'trial',
      maxUsers: 10,
      maxProjects: 5,
      maxStorage: 1024,
      trialDays: 30,
    });
  };

  // Filter companies
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.cnpj?.includes(searchTerm);

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && company.isActive) ||
      (filterStatus === 'trial' && company.isTrialActive) ||
      (filterStatus === 'suspended' && !company.isActive);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Carregando empresas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Empresas</h2>
          <p className="text-sm text-gray-500 mt-1">
            {companies.length} empresas cadastradas
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          + Nova Empresa
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por nome, email ou CNPJ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="trial">Em Trial</SelectItem>
            <SelectItem value="suspended">Suspensas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Companies table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Empresa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Plano
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Usuários
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Projetos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Storage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredCompanies.map((company) => (
              <tr key={company.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{company.name}</div>
                    <div className="text-sm text-gray-500">{company.email}</div>
                    {company.cnpj && (
                      <div className="text-xs text-gray-400">CNPJ: {company.cnpj}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <div className="font-medium capitalize">{company.subscriptionPlan}</div>
                    {company.isTrialActive && (
                      <div className="text-xs text-orange-600">
                        Trial: {company.daysRemainingInTrial} dias restantes
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  {company._count?.users || company.usersCount || 0}
                  {company.maxUsers && ` / ${company.maxUsers}`}
                </td>
                <td className="px-6 py-4 text-sm">
                  {company._count?.projects || company.projectsCount || 0}
                  {company.maxProjects && ` / ${company.maxProjects}`}
                </td>
                <td className="px-6 py-4 text-sm">
                  {(company.storageUsed / 1024).toFixed(2)} GB
                  {company.maxStorage && ` / ${(company.maxStorage / 1024).toFixed(0)} GB`}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    company.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {company.isActive ? 'Ativa' : 'Suspensa'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCompany(company)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant={company.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleCompanyStatus(company)}
                  >
                    {company.isActive ? 'Suspender' : 'Ativar'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhuma empresa encontrada
          </div>
        )}
      </div>

      {/* Create Company Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Empresa</DialogTitle>
            <DialogDescription>
              Criar uma nova empresa com configurações iniciais
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Telefone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CNPJ</label>
                <Input
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Endereço</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Plano</label>
                <Select
                  value={formData.subscriptionPlan}
                  onValueChange={(value) => setFormData({ ...formData, subscriptionPlan: value })}
                >
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
              <div>
                <label className="block text-sm font-medium mb-1">Dias de Trial</label>
                <Input
                  type="number"
                  value={formData.trialDays}
                  onChange={(e) => setFormData({ ...formData, trialDays: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Máx. Usuários</label>
                <Input
                  type="number"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData({ ...formData, maxUsers: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Máx. Projetos</label>
                <Input
                  type="number"
                  value={formData.maxProjects}
                  onChange={(e) => setFormData({ ...formData, maxProjects: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Máx. Storage (MB)</label>
                <Input
                  type="number"
                  value={formData.maxStorage}
                  onChange={(e) => setFormData({ ...formData, maxStorage: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateModalOpen(false);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCompany}>
              Criar Empresa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Atualizar informações da empresa {selectedCompany?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Same form fields as create modal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Telefone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Plano</label>
                <Select
                  value={formData.subscriptionPlan}
                  onValueChange={(value) => setFormData({ ...formData, subscriptionPlan: value })}
                >
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
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Máx. Usuários</label>
                <Input
                  type="number"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData({ ...formData, maxUsers: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Máx. Projetos</label>
                <Input
                  type="number"
                  value={formData.maxProjects}
                  onChange={(e) => setFormData({ ...formData, maxProjects: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Máx. Storage (MB)</label>
                <Input
                  type="number"
                  value={formData.maxStorage}
                  onChange={(e) => setFormData({ ...formData, maxStorage: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditModalOpen(false);
              setSelectedCompany(null);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateCompany}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
