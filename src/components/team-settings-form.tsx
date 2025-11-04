'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { updateTeam } from '@/app/actions/team-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

interface TeamSettingsFormProps {
  team: any;
  onUpdate: () => void;
}

export default function TeamSettingsForm({ team, onUpdate }: TeamSettingsFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: team.name || '',
    cnpj: team.cnpj || '',
    email: team.email || '',
    phone: team.phone || '',
    logo: team.logo || '',
    certifications: team.certifications?.join(', ') || '',
    insurancePolicy: team.insurancePolicy || '',
    insuranceExpiry: team.insuranceExpiry ? new Date(team.insuranceExpiry).toISOString().split('T')[0] : ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const certifications = formData.certifications
        ? formData.certifications.split(',').map(c => c.trim()).filter(Boolean)
        : [];

      const result = await updateTeam(team.id, {
        name: formData.name.trim(),
        cnpj: formData.cnpj || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        logo: formData.logo || undefined,
        certifications,
        insurancePolicy: formData.insurancePolicy || undefined,
        insuranceExpiry: formData.insuranceExpiry ? new Date(formData.insuranceExpiry) : undefined
      });

      if (result) {
        toast({
          title: 'Equipe atualizada',
          description: 'As informações foram salvas com sucesso.'
        });
        onUpdate();
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar a equipe.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating team:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar a equipe.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Dados principais da equipe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Equipe *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleInputChange}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="contato@equipe.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>Imagem de identificação da equipe</CardDescription>
        </CardHeader>
        <CardContent>
          {formData.logo ? (
            <div className="relative inline-block">
              <Image
                src={formData.logo}
                alt="Logo"
                width={120}
                height={120}
                className="rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={handleRemoveLogo}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Label
                htmlFor="logo"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                <Upload className="w-4 h-4" />
                Selecionar Logo
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle>Certificações</CardTitle>
          <CardDescription>Certificações e qualificações da equipe</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="certifications">Certificações</Label>
            <Input
              id="certifications"
              name="certifications"
              value={formData.certifications}
              onChange={handleInputChange}
              placeholder="Ex: NR-35, ISO 9001, ABNT NBR 16325"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separe múltiplas certificações por vírgula
            </p>
          </div>

          {team.certifications && team.certifications.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {team.certifications.map((cert: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {cert}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insurance */}
      <Card>
        <CardHeader>
          <CardTitle>Seguro</CardTitle>
          <CardDescription>Informações sobre seguro de responsabilidade civil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="insurancePolicy">Apólice de Seguro</Label>
              <Input
                id="insurancePolicy"
                name="insurancePolicy"
                value={formData.insurancePolicy}
                onChange={handleInputChange}
                placeholder="Número da apólice"
              />
            </div>
            <div>
              <Label htmlFor="insuranceExpiry">Validade do Seguro</Label>
              <Input
                id="insuranceExpiry"
                name="insuranceExpiry"
                type="date"
                value={formData.insuranceExpiry}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {formData.insuranceExpiry && (
            <div className="text-sm">
              {new Date(formData.insuranceExpiry) < new Date() ? (
                <Badge variant="destructive">Seguro Vencido</Badge>
              ) : (
                <Badge variant="default">Seguro Válido</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
