"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

interface ProjectFormData {
  name: string;
  floorPlanImages: string[];
  obraAddress: string;
  obraCEP: string;
  obraCNPJ: string;
  contratanteName: string;
  contratanteAddress: string;
  contratanteCEP: string;
  cnpjContratado: string;
  contato: string;
  valorContrato: string;
  dataInicio: string;
  dataTermino: string;
  responsavelTecnico: string;
  registroCREA: string;
  tituloProfissional: string;
  numeroART: string;
  rnp: string;
  cargaDeTestePadrao: string;
  tempoDeTestePadrao: string;
  engenheiroResponsavelPadrao: string;
  dispositivoDeAncoragemPadrao: string;
  scalePixelsPerMeter: string;
  dwgRealWidth: string;
  dwgRealHeight: string;
}

interface ProjectFormSectionsProps {
  formData: ProjectFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilesSelect: (files: string[]) => void;
  showFloorPlanUpload?: boolean;
  initialFloorPlans?: string[];
}

function FileUploadInternal({ onFilesSelect, initialFiles = [] }: { onFilesSelect: (base64Files: string[]) => void, initialFiles?: string[] }) {
  const [previews, setPreviews] = React.useState<string[]>(initialFiles);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPreviews: string[] = [];
      const filePromises = Array.from(files).map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            newPreviews.push(base64String);
            resolve(base64String);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(filePromises).then(newFiles => {
        const allFiles = [...previews, ...newFiles];
        setPreviews(allFiles);
        onFilesSelect(allFiles);
      });
    }
  };

  const removeImage = (index: number) => {
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    onFilesSelect(updatedPreviews);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="floor-plan">Planta(s) Baixa(s)</Label>
      <div className="flex items-center gap-2">
        <Input id="floor-plan" type="file" accept="image/*" onChange={handleFileChange} multiple className="file:text-primary file:font-semibold" />
      </div>
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {previews.map((src, index) => (
            <div key={index} className="relative group">
              <img src={src} alt={`Pré-visualização da planta ${index + 1}`} width={100} height={75} className="rounded-md object-contain border p-1" />
              <button
                type="button"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                onClick={() => removeImage(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectFormSections({
  formData,
  onInputChange,
  onFilesSelect,
  showFloorPlanUpload = true,
  initialFloorPlans = []
}: ProjectFormSectionsProps) {
  return (
    <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
      <AccordionItem value="item-1">
        <AccordionTrigger>Informações Essenciais e Padrões</AccordionTrigger>
        <AccordionContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Projeto (Obrigatório)</Label>
            <Input id="name" value={formData.name} onChange={onInputChange} placeholder="Ex: Edifício Central" />
          </div>
          {showFloorPlanUpload && (
            <div className="space-y-2">
              <Label>Plantas Baixas (Opcional)</Label>
              <p className="text-xs text-muted-foreground">Você pode adicionar plantas baixas aqui ou depois na aba "Mapa"</p>
              <FileUploadInternal onFilesSelect={onFilesSelect} initialFiles={initialFloorPlans} />
            </div>
          )}
          <div className="space-y-2 pt-2">
            <Label htmlFor="dispositivoDeAncoragemPadrao">Dispositivo de Ancoragem Padrão</Label>
            <Input id="dispositivoDeAncoragemPadrao" value={formData.dispositivoDeAncoragemPadrao} onChange={onInputChange} placeholder="Ex: Placa de Ancoragem Inox" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cargaDeTestePadrao">Carga de Teste Padrão (kgf)</Label>
              <Input id="cargaDeTestePadrao" value={formData.cargaDeTestePadrao} onChange={onInputChange} placeholder="Ex: 1500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tempoDeTestePadrao">Tempo de Teste Padrão (min)</Label>
              <Input id="tempoDeTestePadrao" value={formData.tempoDeTestePadrao} onChange={onInputChange} placeholder="Ex: 3" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="engenheiroResponsavelPadrao">Engenheiro Responsável Padrão</Label>
            <Input id="engenheiroResponsavelPadrao" value={formData.engenheiroResponsavelPadrao} onChange={onInputChange} placeholder="Ex: Nome do Engenheiro" />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-2">
        <AccordionTrigger>Detalhes da Obra</AccordionTrigger>
        <AccordionContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="obraAddress">Endereço da Obra</Label>
            <Input id="obraAddress" value={formData.obraAddress} onChange={onInputChange} placeholder="Rua, nº, Bairro, Cidade - Estado" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="obraCEP">CEP da Obra</Label>
              <Input id="obraCEP" value={formData.obraCEP} onChange={onInputChange} placeholder="00000-000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obraCNPJ">CNPJ da Obra/Cliente</Label>
              <Input id="obraCNPJ" value={formData.obraCNPJ} onChange={onInputChange} placeholder="00.000.000/0001-00" />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-3">
        <AccordionTrigger>Dados do Contratado</AccordionTrigger>
        <AccordionContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="contratanteName">Empresa Executora</Label>
            <Input id="contratanteName" value={formData.contratanteName} onChange={onInputChange} placeholder="Nome da empresa ou pessoa física" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpjContratado">CNPJ do Contratado</Label>
            <Input id="cnpjContratado" value={formData.cnpjContratado} onChange={onInputChange} placeholder="00.000.000/0001-00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contato">Contato</Label>
            <Input id="contato" value={formData.contato} onChange={onInputChange} placeholder="(XX) 9XXXX-XXXX" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contratanteAddress">Endereço do Contratante</Label>
            <Input id="contratanteAddress" value={formData.contratanteAddress} onChange={onInputChange} placeholder="Rua, nº, Bairro, Cidade - Estado" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contratanteCEP">CEP do Contratante</Label>
              <Input id="contratanteCEP" value={formData.contratanteCEP} onChange={onInputChange} placeholder="00000-000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valorContrato">Valor do Contrato (R$)</Label>
              <Input id="valorContrato" value={formData.valorContrato} onChange={onInputChange} placeholder="Ex: 14820,00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início</Label>
              <Input id="dataInicio" type="date" value={formData.dataInicio} onChange={onInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataTermino">Data de Término</Label>
              <Input id="dataTermino" type="date" value={formData.dataTermino} onChange={onInputChange} />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-4">
        <AccordionTrigger>Responsável Técnico</AccordionTrigger>
        <AccordionContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="responsavelTecnico">Nome do Responsável Técnico</Label>
            <Input id="responsavelTecnico" value={formData.responsavelTecnico} onChange={onInputChange} placeholder="Ex: Lucas Bonissoni" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="registroCREA">Registro CREA</Label>
              <Input id="registroCREA" value={formData.registroCREA} onChange={onInputChange} placeholder="Ex: 148740-0-SC" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tituloProfissional">Título Profissional</Label>
              <Input id="tituloProfissional" value={formData.tituloProfissional} onChange={onInputChange} placeholder="Ex: Engenheiro Civil" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroART">Número da ART</Label>
              <Input id="numeroART" value={formData.numeroART} onChange={onInputChange} placeholder="Número do protocolo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rnp">RNP</Label>
              <Input id="rnp" value={formData.rnp} onChange={onInputChange} placeholder="Ex: 2516534876" />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="escala">
        <AccordionTrigger>Configurações de Escala (DWG)</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure a escala para usar medidas reais na ferramenta de linha. Deixe em branco para usar apenas distribuição visual.
          </p>
          <div className="space-y-2">
            <Label htmlFor="scalePixelsPerMeter">Pixels por Metro</Label>
            <Input
              id="scalePixelsPerMeter"
              type="number"
              step="0.1"
              value={formData.scalePixelsPerMeter}
              onChange={onInputChange}
              placeholder="Ex: 50.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dwgRealWidth">Largura Real (metros)</Label>
              <Input
                id="dwgRealWidth"
                type="number"
                step="0.1"
                value={formData.dwgRealWidth}
                onChange={onInputChange}
                placeholder="Ex: 25.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dwgRealHeight">Altura Real (metros)</Label>
              <Input
                id="dwgRealHeight"
                type="number"
                step="0.1"
                value={formData.dwgRealHeight}
                onChange={onInputChange}
                placeholder="Ex: 15.2"
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
