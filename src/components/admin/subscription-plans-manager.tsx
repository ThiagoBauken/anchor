'use client';

/**
 * Subscription Plans Manager Component
 *
 * Interface administrativa para gerenciar planos de assinatura:
 * - Visualizar todos os planos
 * - Criar novos planos
 * - Editar planos existentes
 * - Ativar/desativar planos
 * - Ver número de assinaturas por plano
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

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    maxUsers: number;
    maxProjects: number;
    maxStorage: number;
    supportLevel: string;
  };
  isActive: boolean;
  subscriptionCount?: number;
}

interface PlanFormData {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxUsers: number;
  maxProjects: number;
  maxPoints: number;
  maxStorageGb: number;
  features: string[];
}

export function SubscriptionPlansManager() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Form state
  const [formData, setFormData] = useState<PlanFormData>({
    id: '',
    name: '',
    description: '',
    priceMonthly: 0,
    priceYearly: 0,
    maxUsers: 10,
    maxProjects: 5,
    maxPoints: 100,
    maxStorageGb: 10,
    features: [],
  });

  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/admin/plans', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }

      const data = await response.json();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create plan');
      }

      setIsCreateModalOpen(false);
      resetForm();
      fetchPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/admin/plans', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: selectedPlan.id,
          ...formData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update plan');
      }

      setIsEditModalOpen(false);
      setSelectedPlan(null);
      resetForm();
      fetchPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleTogglePlanStatus = async (plan: SubscriptionPlan) => {
    if (!plan.isActive) {
      // Ativar plano
      try {
        const token = localStorage.getItem('token');

        const response = await fetch('/api/admin/plans', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: plan.id,
            active: true
          })
        });

        if (!response.ok) {
          throw new Error('Failed to activate plan');
        }

        fetchPlans();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } else {
      // Desativar plano
      if (!confirm(`Tem certeza que deseja desativar o plano ${plan.name}?`)) {
        return;
      }

      try {
        const token = localStorage.getItem('token');

        const response = await fetch(`/api/admin/plans?id=${plan.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to deactivate plan');
        }

        fetchPlans();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setFormData({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.price,
      priceYearly: plan.price * 10, // Exemplo: desconto de ~17%
      maxUsers: plan.limits.maxUsers,
      maxProjects: plan.limits.maxProjects,
      maxPoints: 1000,
      maxStorageGb: plan.limits.maxStorage / 1024,
      features: plan.features,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      priceMonthly: 0,
      priceYearly: 0,
      maxUsers: 10,
      maxProjects: 5,
      maxPoints: 100,
      maxStorageGb: 10,
      features: [],
    });
    setNewFeature('');
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Carregando planos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Planos de Assinatura</h2>
          <p className="text-sm text-gray-500 mt-1">
            {plans.length} planos configurados
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          + Novo Plano
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-lg border-2 p-6 ${
              !plan.isActive ? 'opacity-50 border-gray-200' : 'border-violet-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                plan.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {plan.isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="mb-4">
              <div className="text-3xl font-bold text-violet-600">
                R$ {plan.price.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">por mês</div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="font-medium">Usuários:</span> {plan.limits.maxUsers}
              </div>
              <div className="text-sm">
                <span className="font-medium">Projetos:</span> {plan.limits.maxProjects}
              </div>
              <div className="text-sm">
                <span className="font-medium">Storage:</span> {(plan.limits.maxStorage / 1024).toFixed(0)} GB
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium mb-2">Recursos:</div>
              <ul className="space-y-1">
                {plan.features.slice(0, 3).map((feature, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-center">
                    <span className="mr-2">✓</span>
                    {feature}
                  </li>
                ))}
                {plan.features.length > 3 && (
                  <li className="text-xs text-gray-400">
                    +{plan.features.length - 3} mais...
                  </li>
                )}
              </ul>
            </div>

            {plan.subscriptionCount !== undefined && (
              <div className="text-sm text-gray-500 mb-4">
                {plan.subscriptionCount} assinatura{plan.subscriptionCount !== 1 ? 's' : ''} ativa{plan.subscriptionCount !== 1 ? 's' : ''}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleEditPlan(plan)}
              >
                Editar
              </Button>
              <Button
                variant={plan.isActive ? "destructive" : "default"}
                size="sm"
                className="flex-1"
                onClick={() => handleTogglePlanStatus(plan)}
              >
                {plan.isActive ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Nenhum plano cadastrado
        </div>
      )}

      {/* Create Plan Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Plano de Assinatura</DialogTitle>
            <DialogDescription>
              Criar um novo plano com limites e recursos personalizados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">ID do Plano *</label>
                <Input
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="basic, pro, enterprise..."
                />
                <p className="text-xs text-gray-500 mt-1">Usado para referência interna</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Plano Básico"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição curta do plano"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Preço Mensal (R$) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.priceMonthly}
                  onChange={(e) => setFormData({ ...formData, priceMonthly: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preço Anual (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.priceYearly}
                  onChange={(e) => setFormData({ ...formData, priceYearly: Number(e.target.value) })}
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
                <label className="block text-sm font-medium mb-1">Máx. Pontos</label>
                <Input
                  type="number"
                  value={formData.maxPoints}
                  onChange={(e) => setFormData({ ...formData, maxPoints: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Storage (GB)</label>
              <Input
                type="number"
                value={formData.maxStorageGb}
                onChange={(e) => setFormData({ ...formData, maxStorageGb: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Recursos Incluídos</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Digite um recurso..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <Button type="button" onClick={addFeature} variant="outline">
                  Adicionar
                </Button>
              </div>
              <div className="space-y-1">
                {formData.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{feature}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(idx)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
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
            <Button onClick={handleCreatePlan}>
              Criar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
            <DialogDescription>
              Atualizar informações do plano {selectedPlan?.name}
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
                <label className="block text-sm font-medium mb-1">Preço Mensal (R$) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.priceMonthly}
                  onChange={(e) => setFormData({ ...formData, priceMonthly: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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
                <label className="block text-sm font-medium mb-1">Storage (GB)</label>
                <Input
                  type="number"
                  value={formData.maxStorageGb}
                  onChange={(e) => setFormData({ ...formData, maxStorageGb: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Recursos Incluídos</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Digite um recurso..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <Button type="button" onClick={addFeature} variant="outline">
                  Adicionar
                </Button>
              </div>
              <div className="space-y-1">
                {formData.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{feature}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(idx)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditModalOpen(false);
              setSelectedPlan(null);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePlan}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
