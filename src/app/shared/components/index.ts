// =============================================================================
// SAUDECONECTA - COMPONENTES COMPARTILHADOS
// Exporta todos os componentes reutilizáveis do Design System Healthcare
// =============================================================================

// Patient Header - Cabeçalho com informações do paciente
export { 
  PatientHeaderComponent, 
  PatientHeaderData 
} from './patient-header/patient-header.component';

// Vital Signs - Sinais vitais com validação visual
export { 
  VitalSignsComponent, 
  VitalSign, 
  VitalStatus,
  DEFAULT_VITAL_SIGNS 
} from './vital-signs/vital-signs.component';

// Patient Queue - Fila de pacientes
export { 
  PatientQueueComponent, 
  QueueItem, 
  QueueStatus 
} from './patient-queue/patient-queue.component';

// Medical Alert - Alertas e notificações médicas
export { 
  MedicalAlertComponent, 
  AlertContainerComponent,
  MedicalAlertConfig, 
  AlertType,
  AlertAction 
} from './medical-alert/medical-alert.component';

// Alert Toast Container - Container global de alertas
export { AlertToastContainerComponent } from './alert-toast-container/alert-toast-container.component';
