'use client'

export const dynamic = 'force-dynamic'

import React, { useState } from 'react';
import { useAnchorData } from '@/context/AnchorDataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea-shadcn';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Building2, UserCheck, FileText, Settings, Globe, Shield } from 'lucide-react';

export default function ConfiguracoesPage() {
  const { currentUser } = useAnchorData();
  const { toast } = useToast();
  
  // Estado para as configurações da empresa
  const [companyConfig, setCompanyConfig] = useState({
    // Dados básicos da empresa
    companyFullName: '',
    companyAddress: '',
    companyCep: '',
    companyCity: '',
    companyState: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    
    // Responsável técnico
    technicalResponsible: '',
    technicalCrea: '',
    technicalTitle: '',
    technicalPhone: '',
    technicalEmail: '',
    
    // Certificações
    companyLicense: '',
    insurancePolicy: '',
    insuranceValidity: '',
    certifications: '',
    
    // Configurações técnicas padrão
    defaultTestLoad: '23 kN',
    defaultTestTime: '2 min',
    defaultAnchorType: 'Placa de Ancoragem',
    defaultInspectionPeriod: 12,
    
    // Configurações de relatório
    reportTemplateStyle: 'standard' as 'standard' | 'detailed' | 'compact',
    reportFooter: '',
    
    // Configurações PWA
    offlineModeEnabled: true,
    autoSyncEnabled: true,
    photoCompressionLevel: 80,
    maxOfflineStorage: 500,
    gpsTrackingEnabled: true,
  });

  const handleSave = () => {
    // Aqui salvaria as configurações no localStorage e sincronizaria com o servidor
    localStorage.setItem('anchorViewCompanyConfig', JSON.stringify(companyConfig));
    
    toast({
      title: "Configurações Salvas!",
      description: "As configurações da empresa foram salvas com sucesso.",
      variant: "default",
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setCompanyConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configurações da Empresa</h1>
        <p className="text-gray-600 mt-2">
          Configure os dados da sua empresa uma vez e eles serão aplicados automaticamente em todos os projetos e relatórios.
        </p>
      </div>

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="empresa" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="tecnico" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Responsável Técnico
          </TabsTrigger>
          <TabsTrigger value="certificacoes" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Certificações
          </TabsTrigger>
          <TabsTrigger value="tecnicos" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Padrões Técnicos
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* ABA EMPRESA */}
        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dados da Empresa
              </CardTitle>
              <CardDescription>
                Informações básicas da empresa que aparecerão em todos os relatórios técnicos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyFullName">Nome Completo da Empresa *</Label>
                  <Input
                    id="companyFullName"
                    value={companyConfig.companyFullName}
                    onChange={(e) => handleInputChange('companyFullName', e.target.value)}
                    placeholder="Ex: Alpinismo Industrial São Paulo Ltda"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Telefone Principal</Label>
                  <Input
                    id="companyPhone"
                    value={companyConfig.companyPhone}
                    onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAddress">Endereço Completo</Label>
                <Input
                  id="companyAddress"
                  value={companyConfig.companyAddress}
                  onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                  placeholder="Rua, número, bairro, cidade - UF"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyCep">CEP</Label>
                  <Input
                    id="companyCep"
                    value={companyConfig.companyCep}
                    onChange={(e) => handleInputChange('companyCep', e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyCity">Cidade</Label>
                  <Input
                    id="companyCity"
                    value={companyConfig.companyCity}
                    onChange={(e) => handleInputChange('companyCity', e.target.value)}
                    placeholder="São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyState">Estado</Label>
                  <Input
                    id="companyState"
                    value={companyConfig.companyState}
                    onChange={(e) => handleInputChange('companyState', e.target.value)}
                    placeholder="SP"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email Institucional</Label>
                  <Input
                    id="companyEmail"
                    value={companyConfig.companyEmail}
                    onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                    placeholder="contato@empresa.com.br"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Website</Label>
                  <Input
                    id="companyWebsite"
                    value={companyConfig.companyWebsite}
                    onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                    placeholder="www.empresa.com.br"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA RESPONSÁVEL TÉCNICO */}
        <TabsContent value="tecnico">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Responsável Técnico Padrão
              </CardTitle>
              <CardDescription>
                Dados do responsável técnico que aparecerão automaticamente nos relatórios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="technicalResponsible">Nome do Responsável Técnico *</Label>
                  <Input
                    id="technicalResponsible"
                    value={companyConfig.technicalResponsible}
                    onChange={(e) => handleInputChange('technicalResponsible', e.target.value)}
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technicalCrea">CREA/CAU *</Label>
                  <Input
                    id="technicalCrea"
                    value={companyConfig.technicalCrea}
                    onChange={(e) => handleInputChange('technicalCrea', e.target.value)}
                    placeholder="Ex: CREA-SP 123456789"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="technicalTitle">Título Profissional</Label>
                <Input
                  id="technicalTitle"
                  value={companyConfig.technicalTitle}
                  onChange={(e) => handleInputChange('technicalTitle', e.target.value)}
                  placeholder="Ex: Engenheiro Civil"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="technicalPhone">Telefone do RT</Label>
                  <Input
                    id="technicalPhone"
                    value={companyConfig.technicalPhone}
                    onChange={(e) => handleInputChange('technicalPhone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technicalEmail">Email do RT</Label>
                  <Input
                    id="technicalEmail"
                    value={companyConfig.technicalEmail}
                    onChange={(e) => handleInputChange('technicalEmail', e.target.value)}
                    placeholder="joao@empresa.com.br"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA CERTIFICAÇÕES */}
        <TabsContent value="certificacoes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Certificações e Licenças
              </CardTitle>
              <CardDescription>
                Documentos e certificações da empresa para compliance com normas técnicas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyLicense">Alvará/Licença da Empresa</Label>
                  <Input
                    id="companyLicense"
                    value={companyConfig.companyLicense}
                    onChange={(e) => handleInputChange('companyLicense', e.target.value)}
                    placeholder="Número do alvará"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurancePolicy">Apólice de Seguro</Label>
                  <Input
                    id="insurancePolicy"
                    value={companyConfig.insurancePolicy}
                    onChange={(e) => handleInputChange('insurancePolicy', e.target.value)}
                    placeholder="Número da apólice"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="insuranceValidity">Validade do Seguro</Label>
                <Input
                  id="insuranceValidity"
                  value={companyConfig.insuranceValidity}
                  onChange={(e) => handleInputChange('insuranceValidity', e.target.value)}
                  placeholder="dd/mm/aaaa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certifications">Certificações (uma por linha)</Label>
                <Textarea
                  id="certifications"
                  value={companyConfig.certifications}
                  onChange={(e) => handleInputChange('certifications', e.target.value)}
                  placeholder="ISO 9001:2015&#10;ISO 14001:2015&#10;OHSAS 18001"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA PADRÕES TÉCNICOS */}
        <TabsContent value="tecnicos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Padrões Técnicos
              </CardTitle>
              <CardDescription>
                Configurações padrão que serão aplicadas automaticamente em novos pontos e testes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultTestLoad">Carga de Teste Padrão</Label>
                  <Input
                    id="defaultTestLoad"
                    value={companyConfig.defaultTestLoad}
                    onChange={(e) => handleInputChange('defaultTestLoad', e.target.value)}
                    placeholder="23 kN"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultTestTime">Tempo de Teste Padrão</Label>
                  <Input
                    id="defaultTestTime"
                    value={companyConfig.defaultTestTime}
                    onChange={(e) => handleInputChange('defaultTestTime', e.target.value)}
                    placeholder="2 min"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultAnchorType">Tipo de Ancoragem Padrão</Label>
                <Input
                  id="defaultAnchorType"
                  value={companyConfig.defaultAnchorType}
                  onChange={(e) => handleInputChange('defaultAnchorType', e.target.value)}
                  placeholder="Placa de Ancoragem"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultInspectionPeriod">Período de Inspeção Padrão (meses)</Label>
                <Input
                  id="defaultInspectionPeriod"
                  type="number"
                  value={companyConfig.defaultInspectionPeriod}
                  onChange={(e) => handleInputChange('defaultInspectionPeriod', parseInt(e.target.value))}
                  placeholder="12"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA RELATÓRIOS */}
        <TabsContent value="relatorios">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Configurações de Relatórios
              </CardTitle>
              <CardDescription>
                Personalize como os relatórios técnicos serão gerados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reportTemplateStyle">Estilo do Relatório</Label>
                <Select 
                  value={companyConfig.reportTemplateStyle} 
                  onValueChange={(value: 'standard' | 'detailed' | 'compact') => handleInputChange('reportTemplateStyle', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Padrão - Balanceado</SelectItem>
                    <SelectItem value="detailed">Detalhado - Máxima informação</SelectItem>
                    <SelectItem value="compact">Compacto - Mínimo essencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportFooter">Rodapé Personalizado</Label>
                <Textarea
                  id="reportFooter"
                  value={companyConfig.reportFooter}
                  onChange={(e) => handleInputChange('reportFooter', e.target.value)}
                  placeholder="Texto que aparecerá no rodapé de todos os relatórios..."
                  rows={3}
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Dica:</strong> As configurações de empresa serão aplicadas automaticamente 
                  em todos os novos relatórios. Dados como nome da empresa, responsável técnico e 
                  certificações não precisarão ser inseridos novamente em cada projeto.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA SISTEMA */}
        <TabsContent value="sistema">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>
                Configurações PWA e funcionamento offline para trabalho em campo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Modo Offline (PWA)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Modo Offline</p>
                      <p className="text-sm text-gray-600">Permitir trabalho sem internet</p>
                    </div>
                    <Badge variant={companyConfig.offlineModeEnabled ? "default" : "secondary"}>
                      {companyConfig.offlineModeEnabled ? "Ativado" : "Desativado"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Sincronização Automática</p>
                      <p className="text-sm text-gray-600">Sync quando volta online</p>
                    </div>
                    <Badge variant={companyConfig.autoSyncEnabled ? "default" : "secondary"}>
                      {companyConfig.autoSyncEnabled ? "Ativado" : "Desativado"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Configurações de Foto</h4>
                <div className="space-y-2">
                  <Label htmlFor="photoCompressionLevel">Nível de Compressão (%)</Label>
                  <Input
                    id="photoCompressionLevel"
                    type="number"
                    min="0"
                    max="100"
                    value={companyConfig.photoCompressionLevel}
                    onChange={(e) => handleInputChange('photoCompressionLevel', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-gray-600">
                    Menor valor = maior qualidade, maior tamanho
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Armazenamento</h4>
                <div className="space-y-2">
                  <Label htmlFor="maxOfflineStorage">Armazenamento Máximo Offline (MB)</Label>
                  <Input
                    id="maxOfflineStorage"
                    type="number"
                    value={companyConfig.maxOfflineStorage}
                    onChange={(e) => handleInputChange('maxOfflineStorage', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* BOTÃO SALVAR */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" className="bg-primary hover:bg-primary/90">
          💾 Salvar Configurações
        </Button>
      </div>
    </div>
  );
}