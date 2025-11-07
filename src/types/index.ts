
export interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  cnpj?: string;
  
  // Subscription fields
  subscriptionPlan?: 'trial' | 'basic' | 'pro' | 'enterprise';
  subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused';
  trialStartDate?: string;
  trialEndDate?: string;
  subscriptionExpiryDate?: string;
  isTrialActive?: boolean;
  daysRemainingInTrial?: number;
  
  // Usage and limits
  usersCount?: number;
  projectsCount?: number;
  pointsCount?: number;
  storageUsed?: number; // MB
  maxUsers?: number;
  maxProjects?: number;
  maxStorage?: number; // MB
  
  // Admin fields
  createdAt?: string;
  lastActivity?: string;
  isActive?: boolean;
  notes?: string;

  // DADOS DA EMPRESA DE ALPINISMO - CENTRALIZADOS
  // Informações técnicas que aparecem em todos os relatórios
  companyFullName?: string;           // Nome completo oficial da empresa
  companyAddress?: string;            // Endereço completo da empresa
  companyCep?: string;                // CEP da empresa
  companyCity?: string;               // Cidade da empresa
  companyState?: string;              // Estado da empresa
  companyPhone?: string;              // Telefone principal
  companyEmail?: string;              // Email institucional
  companyWebsite?: string;            // Site da empresa
  
  // Responsável técnico padrão
  technicalResponsible?: string;      // Nome do responsável técnico
  technicalCrea?: string;             // CREA/CAU do responsável
  technicalTitle?: string;            // Título profissional (Engenheiro Civil, etc)
  technicalPhone?: string;            // Telefone do RT
  technicalEmail?: string;            // Email do RT
  
  // Certificações e licenças
  companyLicense?: string;            // Alvará/Licença da empresa
  insurancePolicy?: string;           // Apólice de seguro
  insuranceValidity?: string;         // Validade do seguro
  certifications?: string[];          // Certificações (ISO, etc)
  
  // Configurações técnicas padrão
  defaultTestLoad?: string;           // Carga de teste padrão (ex: "23 kN")
  defaultTestTime?: string;           // Tempo de teste padrão (ex: "2 min")
  defaultAnchorType?: string;         // Tipo de ancoragem padrão
  defaultInspectionPeriod?: number;   // Período padrão de inspeção (meses)
  
  // Configurações de relatório
  reportLogo?: string;                // Logo para relatórios (base64)
  reportFooter?: string;              // Rodapé personalizado dos relatórios
  reportTemplateStyle?: 'standard' | 'detailed' | 'compact'; // Estilo do relatório
  
  // Configurações PWA/Sistema
  offlineModeEnabled?: boolean;       // Modo offline ativado
  autoSyncEnabled?: boolean;          // Sincronização automática
  photoCompressionLevel?: number;     // Nível de compressão (0-100)
  maxOfflineStorage?: number;         // Max storage offline (MB)
  gpsTrackingEnabled?: boolean;       // Tracking GPS ativado

  // Facade inspection categories
  pathologyCategories?: PathologyCategory[];
}

// System statistics for super admin
export interface SystemStats {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  suspendedCompanies: number;
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalPoints: number;
  totalTests: number;
  storageUsed: number; // GB
  monthlyRevenue: number;
  yearlyRevenue: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  expiredSubscriptions: number;
  avgPointsPerProject: number;
  avgTestsPerPoint: number;
  topCompanyByUsage: string;
  systemUptime: number; // days
  lastBackupDate: string;
}

// Admin activity log
export interface AdminActivity {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: 'company' | 'user' | 'subscription' | 'system';
  targetId?: string;
  targetName?: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
}

// Subscription plan definition
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    maxUsers: number;
    maxProjects: number;
    maxStorage: number; // MB
    supportLevel: 'basic' | 'priority' | 'dedicated';
  };
  isActive: boolean;
  displayOrder: number;
}

export type UserRole = 'superadmin' | 'company_admin' | 'team_admin' | 'technician';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  companyId: string;
  company?: Company;
  active: boolean;
  createdAt?: string;
  lastLogin?: string;
  phone?: string;
  password?: string;
  updatedAt?: string;
}

export type MarkerShape = 'circle' | 'square' | 'x' | '+';

export interface Location {
  id: string;
  name: string;
  markerShape: MarkerShape;
  markerColor?: string; // Hex color for the marker (e.g., '#ff0000')
  companyId: string;
  projectId: string; // ✅ CADA PROJETO TEM SUAS PRÓPRIAS LOCALIZAÇÕES
  company?: Company;
  project?: Project;
}

export interface FloorPlan {
  id: string;
  projectId: string;
  name: string;
  image: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  anchorPoints?: AnchorPoint[];
}

export interface Project {
  id: string;
  name: string;
  floorPlanImages: string[]; // base64 data URL array
  companyId: string;
  company?: Company;
  createdByUserId?: string;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;

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

  // Default values for points and tests
  cargaDeTestePadrao?: string;
  tempoDeTestePadrao?: string;
  engenheiroResponsavelPadrao?: string;
  dispositivoDeAncoragemPadrao?: string;

  // Scale configuration for real-world measurements
  scalePixelsPerMeter?: number; // How many pixels represent 1 meter in the DWG
  dwgRealWidth?: number; // Real width of the DWG in meters
  dwgRealHeight?: number; // Real height of the DWG in meters

  // Multiple floor plans
  floorPlans?: FloorPlan[];

  // Facade inspections
  facadeInspections?: FacadeInspection[];
}

// ===== FACADE INSPECTION SYSTEM =====

export type FacadeSideType = 'front' | 'back' | 'left' | 'right' | 'internal';

export type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'archived';

export type PathologySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface FacadeInspection {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: InspectionStatus;
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  inspectorId?: string;
  inspectorName?: string;
  engineerId?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;

  // Relations
  project?: Project;
  createdBy?: User;
  engineer?: User;
  facadeSides?: FacadeSide[];
  reports?: InspectionReport[];
}

export interface FacadeSide {
  id: string;
  inspectionId: string;
  name: string;
  sideType: FacadeSideType;
  image: string; // base64 data URL
  dronePhotoDate?: string;
  weather?: string;
  photographer?: string;
  notes?: string;
  imageWidth?: number;
  imageHeight?: number;
  order: number;

  // Floor and Division configuration (defined before marking)
  availableFloors?: string[]; // e.g., ["1", "2", "3"... "10"] or ["A1", "A2"... "A10"]
  availableDivisions?: string[]; // e.g., ["D1", "D2", "D3"... "D7"]

  createdAt: string;
  updatedAt: string;

  // Relations
  inspection?: FacadeInspection;
  pathologyMarkers?: PathologyMarker[];
}

export interface PathologyCategory {
  id: string;
  projectId: string;
  name: string; // "Fissura", "Infiltração", "Desplacamento", etc.
  color: string; // Hex color (e.g., "#FF5733")
  description?: string;
  severity: PathologySeverity;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  project?: Project;
  markers?: PathologyMarker[];
}

export interface PathologyMarker {
  id: string;
  facadeSideId: string;
  categoryId: string;
  geometry: {
    type: 'rectangle' | 'polygon';  // ← NOVO: tipo de forma
    points?: { x: number; y: number }[];  // Para polígonos (antigo)
    x?: number;  // ← NOVO: Para retângulos
    y?: number;  // ← NOVO: Para retângulos
    width?: number;  // ← NOVO: Para retângulos
    height?: number;  // ← NOVO: Para retângulos
  };
  zIndex?: number;  // Layer control (higher = on top)
  area?: number; // Area in square meters
  floor?: string; // Floor identification (e.g., "7", "10", "Térreo")
  division?: string; // Division identification (e.g., "D1", "D2", "D3"... "D7")
  severity: PathologySeverity;
  description?: string;
  observations?: string;
  status: string; // "PENDING" | "IN_PROGRESS" | "RESOLVED" | "IGNORED"
  priority: number;
  photos: string[]; // Array of base64 data URLs for close-up photos
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;

  // Relations
  facadeSide?: FacadeSide;
  category?: PathologyCategory;
  createdBy?: User;
}

export interface InspectionReport {
  id: string;
  inspectionId: string;
  reportNumber: string; // Laudo number (e.g., "LAUDO-2025-001")
  title: string;
  content: string; // Rich text or markdown content
  engineerId: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  version: number;
  generatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  pdfUrl?: string; // URL or path to generated PDF
  createdAt: string;
  updatedAt: string;

  // Relations
  inspection?: FacadeInspection;
  engineer?: User;
  approver?: User;
}

// ===== END FACADE INSPECTION SYSTEM =====

export interface AnchorPoint {
  id: string;
  projectId: string; // Link to project
  floorPlanId?: string; // Floor plan ID
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
  archivedById?: string;

  // CAMPOS PWA AVANÇADOS
  deviceId?: string;              // ID do dispositivo que criou/editou
  syncStatus?: 'pending' | 'synced' | 'conflict' | 'error'; // Status de sincronização
  lastSyncedAt?: string;          // Última sincronização
  offlineCreated?: boolean;       // Se foi criado offline
  photoUploadPending?: boolean;   // Se foto está pendente de upload
  photoCompressed?: boolean;      // Se foto foi comprimida
  originalPhotoSize?: number;     // Tamanho original da foto (bytes)
  
  // CAMPOS DE LOCALIZAÇÃO GPS
  gpsLatitude?: number;           // Coordenada GPS
  gpsLongitude?: number;          // Coordenada GPS
  gpsAltitude?: number;           // Altitude GPS
  gpsAccuracy?: number;           // Precisão GPS (metros)
  gpsTimestamp?: string;          // Timestamp da captura GPS
  
  // CAMPOS DE AUDITORIA PROFISSIONAL
  installerName?: string;         // Nome do instalador
  installerCrea?: string;         // CREA do instalador
  installerCompany?: string;      // Empresa instaladora
  manufacturingDate?: string;     // Data de fabricação do equipamento
  warrantyExpiration?: string;    // Vencimento da garantia
  certificateNumber?: string;     // Número do certificado do equipamento
  batchNumber?: string;           // Lote de fabricação
  
  // INSPEÇÕES REGULAMENTARES
  lastInspectionDate?: string;    // Última inspeção oficial
  nextInspectionDate?: string;    // Próxima inspeção obrigatória
  inspectionInterval?: number;    // Intervalo de inspeção em dias (padrão 180)
  inspectionCertificate?: string; // Certificado de inspeção
  inspectionStatus?: 'em-dia' | 'vencendo' | 'vencido'; // Status da inspeção
  
  // METADADOS DE CAMPO
  fieldConditions?: string;       // Condições do tempo/campo na inspeção
  accessDifficulty?: 'fácil' | 'médio' | 'difícil' | 'extremo'; // Dificuldade de acesso
  riskLevel?: 'baixo' | 'médio' | 'alto' | 'crítico'; // Nível de risco
  maintenanceRequired?: boolean;  // Se requer manutenção
  maintenanceNotes?: string;      // Observações de manutenção
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

  // CAMPOS PWA AVANÇADOS
  deviceId?: string;              // ID do dispositivo que criou o teste
  syncStatus?: 'pending' | 'synced' | 'conflict' | 'error'; // Status de sincronização
  lastSyncAt?: string;            // Última sincronização
  offlineCreated?: boolean;       // Se foi criado offline
  photosUploadPending?: boolean;  // Se fotos estão pendentes de upload

  // CONFORMIDADE E CERTIFICAÇÃO (Novos campos Prisma)
  regulatoryStandard?: string;    // Norma regulamentar aplicada
  complianceStatus?: string;      // Status de conformidade
  certificationNumber?: string;   // Número de certificação
  
  // CAMPOS DE AUDITORIA DO TESTE
  testTemperature?: number;       // Temperatura durante o teste (°C)
  testHumidity?: number;          // Umidade durante o teste (%)
  testWindSpeed?: number;         // Velocidade do vento (km/h)
  testWeatherConditions?: string; // Condições climáticas

  // CAMPOS AMBIENTAIS PADRONIZADOS (Novos campos Prisma)
  weatherConditions?: string;     // Condições climáticas padronizadas
  temperature?: number;           // Temperatura (°C)
  humidity?: number;              // Umidade (%)
  
  // EQUIPAMENTOS UTILIZADOS NO TESTE (Novos campos Prisma)
  equipmentUsed?: string;         // Equipamento utilizado
  equipmentSerialNumber?: string; // Número de série do equipamento
  equipmentCalibration?: string;  // Data de calibração do equipamento

  // EQUIPAMENTOS LEGADOS (manter compatibilidade)
  dynamometerModel?: string;      // Modelo do dinamômetro
  dynamometerSerial?: string;     // Série do dinamômetro
  dynamometerCalibration?: string; // Data da calibração
  testEquipmentCertificate?: string; // Certificado do equipamento
  
  // DADOS DO TÉCNICO RESPONSÁVEL
  technicianCrea?: string;        // CREA do técnico
  technicianCertificates?: string[]; // Certificações do técnico
  witnessName?: string;           // Nome da testemunha
  witnessDocument?: string;       // Documento da testemunha

  // CREDENCIAIS DO TÉCNICO PADRONIZADAS (Novos campos Prisma)
  technicianLicense?: string;     // Licença/registro profissional do técnico
  technicianCertification?: string; // Certificação profissional
  supervisorId?: string;          // ID do supervisor responsável
  
  // CONFORMIDADE E NORMAS
  appliedStandards?: string[];    // Normas aplicadas (NR-35, NBR 16325, etc)
  testProcedure?: string;         // Procedimento utilizado
  deviationsFromStandard?: string; // Desvios do padrão
  additionalTestsPerformed?: string[]; // Testes adicionais realizados
  
  // REGISTRO DETALHADO
  testStartTime?: string;         // Hora de início do teste
  testEndTime?: string;           // Hora de fim do teste
  testDuration?: number;          // Duração real do teste (segundos)
  maxForceReached?: string;       // Força máxima atingida
  failureMode?: string;           // Modo de falha (se aplicável)
  
  // LOCALIZAÇÃO DO TESTE
  gpsLatitude?: number;           // GPS do local do teste
  gpsLongitude?: number;          // GPS do local do teste
  gpsAccuracy?: number;           // Precisão GPS
  
  // PRÓXIMOS PASSOS
  correctiveActionsRequired?: boolean; // Se requer ações corretivas
  correctiveActions?: string;     // Ações corretivas necessárias
  retestRequired?: boolean;       // Se requer novo teste
  retestDate?: string;            // Data para novo teste
}

// ===== NOVOS TIPOS PARA SISTEMA COMPLETO =====

// Backup system
export interface BackupConfig {
  id: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  includeFiles: boolean;
  compressBackups: boolean;
  encryptBackups: boolean;
  backupPath: string;
  lastBackup?: string;
  nextBackup?: string;
  backupSize?: number; // MB
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  type: 'automatic' | 'manual';
  status: 'completed' | 'failed' | 'in_progress';
  size: number; // MB
  duration: number; // seconds
  error?: string;
  tablesBackedUp: string[];
  filesCount: number;
  companyId?: string; // For company-specific backups
}

// User session tracking
export interface UserSession {
  id: string;
  userId: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  loginTime: string;
  lastActivity: string;
  isActive: boolean;
  sessionDuration?: number; // minutes
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
}

// File management
export interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploaded: boolean;
  companyId: string;
  userId: string;
  createdAt: string;
  syncStatus: 'pending' | 'synced' | 'error';
  thumbnailPath?: string;
  metadata?: {
    width?: number;
    height?: number;
    gpsLatitude?: number;
    gpsLongitude?: number;
    deviceModel?: string;
    dateTime?: string;
  };
}

// Sync queue for offline operations
export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  tableName: string;
  recordId: string;
  data: any;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  retries: number;
  maxRetries: number;
  error?: string;
  companyId: string;
  userId: string;
  createdAt: string;
  syncedAt?: string;
  priority: 'low' | 'normal' | 'high';
}

// Notification system
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  data?: any;
  readAt?: string;
  expiresAt?: string;
  createdAt: string;
  actionUrl?: string;
  persistent: boolean;
}

// Usage analytics
export interface UsageAnalytics {
  companyId: string;
  date: string; // YYYY-MM-DD
  activeUsers: number;
  projectsCreated: number;
  pointsCreated: number;
  testsPerformed: number;
  photosUploaded: number;
  storageUsed: number; // MB
  syncOperations: number;
  loginCount: number;
  sessionDuration: number; // average minutes
  topFeatures: string[]; // most used features
}

// System health monitoring
export interface SystemHealth {
  timestamp: string;
  status: 'healthy' | 'warning' | 'critical';
  services: {
    database: 'online' | 'offline' | 'slow';
    storage: 'online' | 'offline' | 'full';
    sync: 'active' | 'inactive' | 'overloaded';
    backup: 'current' | 'outdated' | 'failed';
  };
  metrics: {
    responseTime: number; // ms
    cpuUsage: number; // %
    memoryUsage: number; // %
    diskUsage: number; // %
    activeConnections: number;
    queueLength: number;
  };
  alerts: string[];
}

// Permission system
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'company' | 'project' | 'point' | 'test';
  actions: string[]; // ['read', 'write', 'delete', 'admin']
  restrictions?: {
    ownDataOnly?: boolean;
    companyDataOnly?: boolean;
    timeRestricted?: boolean;
  };
}

export interface UserPermission {
  userId: string;
  permissionId: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
  resourceType?: string;
  resourceId?: string;
  restrictions?: any;
}

// Audit trail
export interface AuditLog {
  id: string;
  tableName: string;
  recordId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  oldValues?: any;
  newValues?: any;
  changedFields: string[];
  userId?: string;
  sessionId?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  companyId?: string;
  metadata?: any;
}

// Company subscription tracking
export interface SubscriptionHistory {
  id: string;
  companyId: string;
  planId: string;
  action: 'subscribe' | 'upgrade' | 'downgrade' | 'cancel' | 'renew' | 'suspend';
  previousPlan?: string;
  newPlan?: string;
  effectiveDate: string;
  amount?: number;
  paymentMethod?: string;
  adminId: string;
  reason?: string;
  notes?: string;
}

// ===== NOVOS TIPOS - SISTEMA B2B2C =====

// Teams (Equipes de Alpinismo)
export interface Team {
  id: string;
  name: string;
  companyId: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string; // Endereço da empresa
  logo?: string; // base64 data URL ou URL pública
  website?: string; // Site da empresa
  certifications: string[]; // Array de certificações (ISO, NR-35, etc)
  insurancePolicy?: string; // Número da apólice de seguro
  insuranceExpiry?: Date | string; // Data de vencimento do seguro
  insuranceValue?: number; // Valor da apólice
  managerName?: string; // Nome do responsável
  managerPhone?: string; // Telefone do responsável
  managerEmail?: string; // Email do responsável
  active: boolean;
  notes?: string; // Observações internas
  createdAt: Date | string;
  updatedAt: Date | string;

  // Relations
  company?: Company;
  members?: TeamMember[];
  projectPermissions?: ProjectTeamPermission[];
}

// Team Members (Membros das Equipes)
export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'leader' | 'member' | 'observer'; // Enum: TeamMemberRole no Prisma
  active: boolean; // Membro ativo ou removido
  joinedAt: Date | string;

  // Relations
  team?: Team;
  user?: User;
}

// Project Team Permissions (Permissões por Projeto)
export interface ProjectTeamPermission {
  id: string;
  projectId: string;
  teamId: string;
  canView: boolean; // Visualizar projeto
  canCreatePoints: boolean; // Criar novos pontos
  canEditPoints: boolean; // Editar pontos existentes
  canDeletePoints: boolean; // Deletar pontos
  canTestPoints: boolean; // Realizar testes
  canExportReports: boolean; // Exportar relatórios
  canViewMap: boolean; // Visualizar mapa
  grantedBy: string; // ID do usuário que concedeu
  grantedAt: Date | string;
  expiresAt?: Date | string; // Permissão com prazo de validade
  notes?: string; // Observações sobre a permissão

  // Relations
  project?: Project;
  team?: Team;
}

// Public Visualization Settings
export interface ProjectPublicSettings {
  id: string;
  projectId: string;
  isPublic: boolean;
  publicToken: string; // Unique token for public URL
  showTestHistory: boolean;
  showPhotos: boolean;
  welcomeMessage?: string;
  totalViews: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  project?: Project;
}

// Public View Logs (Analytics)
export interface PublicViewLog {
  id: string;
  projectId: string;
  viewedAt: string;
  userAgent?: string;
  ipAddress?: string;
  deviceType?: string; // 'mobile' | 'desktop' | 'tablet'
}

// Public Problem Reports
export interface PublicProblemReport {
  id: string;
  projectId: string;
  anchorPointNumber?: string;
  description: string;
  contactEmail?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'acknowledged' | 'resolved' | 'rejected';
  reportedAt: string;
  resolvedAt?: string;
  adminNotes?: string;

  // Relations
  project?: Project;
}

// Notification Settings
export interface NotificationSettings {
  id: string;
  companyId: string;
  emailEnabled: boolean;
  adminEmails: string[]; // Array de emails dos administradores
  notifyOnTestFail: boolean;
  notifyOnInspectionDue: boolean;
  notifyOnPublicReport: boolean;
  daysBeforeInspection: number; // Quantos dias antes notificar
  dailyDigestEnabled: boolean;
  weeklyReportEnabled: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations
  company?: Company;
}

// Notification Logs
export interface NotificationLog {
  id: string;
  companyId: string;
  type: string; // 'test_failed' | 'inspection_due' | 'public_report' | 'daily_digest' | 'weekly_report'
  recipient: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt: string;
  metadata?: string; // JSON string with additional data

  // Relations
  company?: Company;
}
