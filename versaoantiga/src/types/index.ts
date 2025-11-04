
export interface User {
  id: string;
  name: string;
  role: 'admin' | 'user';
}

export type MarkerShape = 'circle' | 'square' | 'x' | '+';

export interface Location {
  id: string;
  name: string;
  markerShape: MarkerShape;
}

export interface Project {
  id: string;
  name: string;
  floorPlanImages: string[]; // base64 data URL array
  createdByUserId?: string;
  
  // Fields for the report
  obraAddress?: string;
  obraCEP?: string;
  obraCNPJ?: string;
  contratanteName?: string;
  contratanteAddress?: string;
  contratanteCEP?: string;
  cnpjContratado?: string;
  contato?: string;
  valorContrato?: string;
  dataInicio?: string;
  dataTermino?: string;
  responsavelTecnico?: string;
  registroCREA?: string;
  tituloProfissional?: string;
  numeroART?: string;
  rnp?: string;
}

export interface AnchorPoint {
  id: string;
  projectId: string; // Link to project
  numeroPonto: string;
  localizacao: string; // The name of the location
  foto?: string; // base64 data URL - Now optional
  
  numeroLacre?: string;
  tipoEquipamento?: string;
  dataInstalacao?: string;
  frequenciaInspecaoMeses?: number;
  observacoes?: string;

  posicaoX: number; // Position relative to the floor plan image
  posicaoY: number; // Position relative to the floor plan image
  dataHora: string; // ISO string for creation date
  status: 'Aprovado' | 'Reprovado' | 'Não Testado';
  createdByUserId?: string;
  lastModifiedByUserId?: string;
  
  // Soft-delete
  archived?: boolean;
  archivedAt?: string;
}

export interface AnchorTestResult {
  resultado: 'Aprovado' | 'Reprovado';
  carga: string;
  tempo: string;
  tecnico: string;
  observacoes?: string;
  fotoTeste?: string; // Photo during the test
  fotoPronto?: string; // Photo of the finished point
  dataFotoPronto?: string; // Date for the finished photo
}


export interface AnchorTest extends AnchorTestResult {
  id: string;
  pontoId: string;
  dataHora: string; // ISO string for the test date
  createdByUserId?: string;
}
