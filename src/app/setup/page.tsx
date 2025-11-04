"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    secretKey: ''
  });

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch('/api/auth/setup');
      if (response.ok) {
        const data = await response.json();
        setSetupCompleted(data.setupCompleted);
      }
    } catch (error) {
      console.error('Erro ao verificar setup:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.name || !formData.email || !formData.password || !formData.secretKey) {
      toast({
        title: 'Erro',
        description: 'Todos os campos são obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'Senhas não coincidem.',
        variant: 'destructive'
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: 'Erro',
        description: 'Senha deve ter pelo menos 8 caracteres.',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: 'Setup Concluído!',
          description: `Super admin ${result.superAdmin.name} criado com sucesso.`,
        });

        // Redireciona para login após 2 segundos
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);

      } else {
        const error = await response.json();
        toast({
          title: 'Erro no Setup',
          description: error.error || 'Erro desconhecido.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro no setup:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao conectar com o servidor.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verificando configuração do sistema...</p>
        </div>
      </div>
    );
  }

  if (setupCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Sistema Configurado</CardTitle>
            <CardDescription>
              O AnchorView já foi configurado e está pronto para uso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/auth/login')} 
              className="w-full"
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Configuração Inicial</CardTitle>
          <CardDescription>
            Configure o super administrador do AnchorView
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome completo"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                required
              />
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Digite a senha novamente"
                required
              />
            </div>

            {/* Chave Secreta */}
            <div className="space-y-2">
              <Label htmlFor="secretKey">Chave Secreta *</Label>
              <div className="relative">
                <Input
                  id="secretKey"
                  type={showSecretKey ? "text" : "password"}
                  value={formData.secretKey}
                  onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                  placeholder="Chave fornecida pelo desenvolvedor"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                >
                  {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Aviso de Segurança */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Importante:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Esta conta terá acesso total ao sistema</li>
                    <li>• Guarde as credenciais em local seguro</li>
                    <li>• A chave secreta é fornecida pelo desenvolvedor</li>
                    <li>• Esta configuração só pode ser feita uma vez</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Botão Submit */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Configurando...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Criar Super Admin
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}