'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createTeam } from '@/app/actions/team-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  companyId: string;
}

export default function CreateTeamDialog({ open, onOpenChange, onSuccess, companyId }: CreateTeamDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    logo: '',
    certifications: '',
    insurancePolicy: '',
    insuranceExpiry: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    if (!formData.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe o nome da equipe.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const certifications = formData.certifications
        ? formData.certifications.split(',').map(c => c.trim()).filter(Boolean)
        : [];

      const result = await createTeam({
        name: formData.name.trim(),
        companyId,
        cnpj: formData.cnpj || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        logo: formData.logo || undefined,
        certifications,
        insurancePolicy: formData.insurancePolicy || undefined,
        insuranceExpiry: formData.insuranceExpiry ? new Date(formData.insuranceExpiry) : undefined
      });

      if (result) {
        // Reset form
        setFormData({
          name: '',
          cnpj: '',
          email: '',
          phone: '',
          logo: '',
          certifications: '',
          insurancePolicy: '',
          insuranceExpiry: ''
        });
        onSuccess();
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível criar a equipe.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao criar a equipe.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Equipe de Alpinismo</DialogTitle>
          <DialogDescription>
            Cadastre uma nova equipe e depois adicione membros e permissões
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">Informações Básicas</h3>

            <div>
              <Label htmlFor="name">Nome da Equipe *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Alpinismo Seguro Ltda"
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
          </div>

          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo da Equipe</Label>
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
          </div>

          {/* Certifications */}
          <div>
            <Label htmlFor="certifications">Certificações</Label>
            <Input
              id="certifications"
              name="certifications"
              value={formData.certifications}
              onChange={handleInputChange}
              placeholder="Ex: NR-35, ISO 9001, ABNT NBR 16325 (separar por vírgula)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separe múltiplas certificações por vírgula
            </p>
          </div>

          {/* Insurance */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">Seguro</h3>

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
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Equipe'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
