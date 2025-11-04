'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Globe,
  QrCode,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Download,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCodeGenerator from '@/components/qrcode-generator';

interface PublicSettingsDialogProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PublicSettingsDialog({
  projectId,
  projectName,
  open,
  onOpenChange
}: PublicSettingsDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<any>(null);
  const [formData, setFormData] = useState({
    isPublic: false,
    showTestHistory: true,
    showPhotos: true,
    welcomeMessage: ''
  });

  // Analytics state
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);

  // Load settings when dialog opens
  useEffect(() => {
    if (open && projectId) {
      loadSettings();
    }
  }, [open, projectId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Dynamic import to avoid HMR issues
      const {
        getProjectPublicSettings,
        getPublicViewStats,
        getProjectProblemReports
      } = await import('@/app/actions/public-actions');

      const [settingsData, statsData, reportsData] = await Promise.all([
        getProjectPublicSettings(projectId),
        getPublicViewStats(projectId),
        getProjectProblemReports(projectId, 'pending')
      ]);

      setSettings(settingsData);
      setStats(statsData);
      setReports(reportsData);

      if (settingsData) {
        setFormData({
          isPublic: settingsData.isPublic,
          showTestHistory: settingsData.showTestHistory,
          showPhotos: settingsData.showPhotos,
          welcomeMessage: settingsData.welcomeMessage || ''
        });
      }
    } catch (error) {
      console.error('Error loading public settings:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublic = async () => {
    setSaving(true);
    try {
      // Dynamic import to avoid HMR issues
      const { enablePublicViewing, disablePublicViewing } = await import('@/app/actions/public-actions');

      if (formData.isPublic) {
        // Disable public viewing
        const success = await disablePublicViewing(projectId);
        if (success) {
          setFormData({ ...formData, isPublic: false });
          toast({
            title: 'Visualização pública desativada',
            description: 'O projeto não está mais acessível publicamente.'
          });
          loadSettings();
        }
      } else {
        // Enable public viewing
        const result = await enablePublicViewing(projectId, {
          showTestHistory: formData.showTestHistory,
          showPhotos: formData.showPhotos,
          welcomeMessage: formData.welcomeMessage
        });

        // Always allow public viewing, even for projects in localStorage
        setFormData({ ...formData, isPublic: true });
        toast({
          title: 'Visualização pública ativada!',
          description: 'O projeto agora está acessível via QR Code. O histórico de testes e mapeamento dos pontos ficam visíveis para quem tem o link.'
        });
        loadSettings();
      }
    } catch (error: any) {
      console.error('Toggle public error:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível alterar a visualização pública.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const { updatePublicSettings } = await import('@/app/actions/public-actions');

      const result = await updatePublicSettings(projectId, {
        showTestHistory: formData.showTestHistory,
        showPhotos: formData.showPhotos,
        welcomeMessage: formData.welcomeMessage
      });

      if (result) {
        toast({
          title: 'Configurações salvas',
          description: 'As alterações foram aplicadas com sucesso.'
        });
        loadSettings();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (!confirm('Isso irá invalidar o QR Code antigo. Você terá que imprimir um novo. Continuar?')) {
      return;
    }

    setSaving(true);
    try {
      const { regeneratePublicToken } = await import('@/app/actions/public-actions');

      const result = await regeneratePublicToken(projectId);
      if (result) {
        toast({
          title: 'Token regenerado',
          description: 'Um novo QR Code foi gerado. Atualize os QR Codes impressos.'
        });
        loadSettings();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível regenerar o token.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const copyPublicUrl = () => {
    if (settings?.publicToken) {
      const baseUrl = window.location.origin;
      const publicUrl = `${baseUrl}/public/project/${settings.publicToken}`;
      navigator.clipboard.writeText(publicUrl);
      toast({
        title: 'Link copiado!',
        description: 'O link público foi copiado para a área de transferência.'
      });
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const publicUrl = settings?.publicToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/public/project/${settings.publicToken}`
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Visualização Pública - {projectName}
          </DialogTitle>
          <DialogDescription>
            Configure como este projeto será exibido publicamente via QR Code
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="settings" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            {/* Enable/Disable Toggle */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Acesso Público</CardTitle>
                    <CardDescription>
                      Permitir que qualquer pessoa visualize este projeto via QR Code
                    </CardDescription>
                  </div>
                  <Switch
                    checked={formData.isPublic}
                    onCheckedChange={handleTogglePublic}
                    disabled={saving}
                  />
                </div>
              </CardHeader>
            </Card>

            {formData.isPublic && (
              <>
                {/* Privacy Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Privacidade</CardTitle>
                    <CardDescription>
                      Escolha quais informações serão exibidas publicamente
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Mostrar Histórico de Testes</Label>
                        <p className="text-sm text-gray-500">
                          Exibe todos os testes realizados em cada ponto
                        </p>
                      </div>
                      <Switch
                        checked={formData.showTestHistory}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, showTestHistory: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Mostrar Fotos</Label>
                        <p className="text-sm text-gray-500">
                          Exibe fotos dos pontos e dos testes
                        </p>
                      </div>
                      <Switch
                        checked={formData.showPhotos}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, showPhotos: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Welcome Message */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Mensagem de Boas-Vindas</CardTitle>
                    <CardDescription>
                      Mensagem personalizada exibida no topo da página pública
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Ex: Bem-vindo ao Edifício Solar! Aqui você pode acompanhar o histórico de inspeções dos nossos pontos de ancoragem."
                      value={formData.welcomeMessage}
                      onChange={(e) =>
                        setFormData({ ...formData, welcomeMessage: e.target.value })
                      }
                      rows={3}
                    />
                  </CardContent>
                </Card>

                {/* Save Button */}
                <Button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </>
            )}
          </TabsContent>

          {/* QR Code Tab */}
          <TabsContent value="qrcode" className="mt-4">
            {!formData.isPublic ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <EyeOff className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Ative a visualização pública para gerar o QR Code</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Public URL */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Link Público</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input value={publicUrl} readOnly className="font-mono text-sm" />
                      <Button onClick={copyPublicUrl} variant="outline" size="icon">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleRegenerateToken}
                      variant="outline"
                      size="sm"
                      disabled={saving}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerar Link (Invalidar QR Code Antigo)
                    </Button>
                  </CardContent>
                </Card>

                {/* QR Code Generator */}
                {settings?.publicToken && (
                  <QRCodeGenerator
                    url={publicUrl}
                    projectName={projectName}
                  />
                )}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-4 space-y-4">
            {/* View Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-violet-600">
                    {stats?.totalViews || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Total de Visualizações</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {stats?.last24Hours || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Últimas 24h</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {stats?.last7Days || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Últimos 7 dias</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {stats?.last30Days || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Últimos 30 dias</p>
                </CardContent>
              </Card>
            </div>

            {/* Problem Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Reportes Pendentes ({reports.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum reporte pendente no momento.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {reports.map(report => (
                      <div key={report.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            {report.anchorPointNumber && (
                              <p className="font-semibold text-sm">
                                Ponto: {report.anchorPointNumber}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">{report.description}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            report.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            report.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            report.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {report.priority}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(report.reportedAt).toLocaleString('pt-BR')}
                          {report.contactEmail && ` - ${report.contactEmail}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
