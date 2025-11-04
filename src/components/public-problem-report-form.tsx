'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { submitPublicProblemReport } from '@/app/actions/public-actions';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface PublicProblemReportFormProps {
  projectId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PublicProblemReportForm({ projectId, onSuccess, onCancel }: PublicProblemReportFormProps) {
  const [formData, setFormData] = useState({
    anchorPointNumber: '',
    description: '',
    contactEmail: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      setErrorMessage('Por favor, descreva o problema encontrado.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const result = await submitPublicProblemReport(projectId, {
        anchorPointNumber: formData.anchorPointNumber || undefined,
        description: formData.description,
        contactEmail: formData.contactEmail || undefined,
        priority: formData.priority
      });

      if (result) {
        setSubmitStatus('success');
        // Reset form
        setFormData({
          anchorPointNumber: '',
          description: '',
          contactEmail: '',
          priority: 'medium'
        });

        // Call success callback after a delay
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        setSubmitStatus('error');
        setErrorMessage('Não foi possível enviar o reporte. Tente novamente.');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitStatus('error');
      setErrorMessage('Erro ao enviar o reporte. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Reporte Enviado com Sucesso!
        </h3>
        <p className="text-gray-600">
          Obrigado por nos informar. A administradora será notificada e entrará em contato se necessário.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Anchor Point Number (Optional) */}
      <div>
        <Label htmlFor="anchorPointNumber">Número do Ponto (Opcional)</Label>
        <Input
          id="anchorPointNumber"
          placeholder="Ex: A1-01"
          value={formData.anchorPointNumber}
          onChange={(e) => setFormData({ ...formData, anchorPointNumber: e.target.value })}
          disabled={isSubmitting}
        />
        <p className="text-xs text-gray-500 mt-1">
          Se o problema for em um ponto específico, informe o número dele.
        </p>
      </div>

      {/* Description (Required) */}
      <div>
        <Label htmlFor="description">Descrição do Problema *</Label>
        <Textarea
          id="description"
          placeholder="Descreva o problema encontrado..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={isSubmitting}
          rows={4}
          required
        />
      </div>

      {/* Priority */}
      <div>
        <Label htmlFor="priority">Prioridade</Label>
        <Select
          value={formData.priority}
          onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Baixa - Observação geral</SelectItem>
            <SelectItem value="medium">Média - Requer atenção</SelectItem>
            <SelectItem value="high">Alta - Problema sério</SelectItem>
            <SelectItem value="urgent">Urgente - Risco de segurança</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contact Email (Optional) */}
      <div>
        <Label htmlFor="contactEmail">Email para Contato (Opcional)</Label>
        <Input
          id="contactEmail"
          type="email"
          placeholder="seu@email.com"
          value={formData.contactEmail}
          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
          disabled={isSubmitting}
        />
        <p className="text-xs text-gray-500 mt-1">
          Se quiser receber atualizações sobre este reporte, deixe seu email.
        </p>
      </div>

      {/* Error Message */}
      {(submitStatus === 'error' || errorMessage) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{errorMessage || 'Erro ao enviar o reporte.'}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar Reporte'
          )}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        * Campos obrigatórios
      </p>
    </form>
  );
}
