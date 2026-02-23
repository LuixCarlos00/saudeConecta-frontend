import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Tipos de alerta médico
 */
export type MedicalAlertType = 'info' | 'success' | 'warning' | 'danger' | 'critical';

/**
 * Prioridade do alerta
 */
export type AlertPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Interface para configuração de alerta médico
 */
export interface MedicalAlert {
  id: string;
  type: MedicalAlertType;
  title: string;
  message: string;
  priority: AlertPriority;
  timestamp: Date;
  icon?: string;
  dismissible?: boolean;
  autoClose?: number;
  persistent?: boolean;
  category?: 'clinical' | 'system' | 'reminder' | 'validation';
  patientId?: number | string;
  actions?: AlertAction[];
  metadata?: Record<string, unknown>;
}

export interface AlertAction {
  label: string;
  action: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

/**
 * Configurações padrão para alertas
 */
const DEFAULT_AUTO_CLOSE: Record<MedicalAlertType, number> = {
  info: 5000,
  success: 3000,
  warning: 8000,
  danger: 0, // Não fecha automaticamente
  critical: 0 // Não fecha automaticamente
};

/**
 * Serviço de Alertas Médicos
 * 
 * Gerencia notificações e alertas críticos no sistema de saúde.
 * Segue padrões de Healthcare UX para máxima visibilidade de informações críticas.
 * 
 * @example
 * ```typescript
 * // Alerta crítico de alergia
 * this.alertService.critical('Alergia Detectada', 'Paciente alérgico a Penicilina');
 * 
 * // Alerta de validação
 * this.alertService.warning('Atenção', 'Pressão arterial acima do normal');
 * 
 * // Sucesso
 * this.alertService.success('Prontuário Salvo', 'Dados salvos com sucesso');
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class MedicalAlertService {
  private readonly alerts$ = new BehaviorSubject<MedicalAlert[]>([]);
  private readonly maxAlerts = 5;

  /**
   * Observable com a lista de alertas ativos
   */
  get alerts(): Observable<MedicalAlert[]> {
    return this.alerts$.asObservable();
  }

  /**
   * Lista atual de alertas
   */
  get currentAlerts(): MedicalAlert[] {
    return this.alerts$.getValue();
  }

  /**
   * Gera um ID único para o alerta
   */
  private generateId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Adiciona um novo alerta
   */
  private addAlert(alert: Omit<MedicalAlert, 'id' | 'timestamp'>): MedicalAlert {
    const newAlert: MedicalAlert = {
      ...alert,
      id: this.generateId(),
      timestamp: new Date(),
      dismissible: alert.dismissible ?? true,
      autoClose: alert.autoClose ?? DEFAULT_AUTO_CLOSE[alert.type]
    };

    const currentAlerts = this.alerts$.getValue();
    
    // Remove alertas antigos se exceder o máximo (exceto críticos)
    let updatedAlerts = [...currentAlerts, newAlert];
    if (updatedAlerts.length > this.maxAlerts) {
      updatedAlerts = updatedAlerts
        .filter(a => a.type === 'critical' || a.persistent)
        .concat(updatedAlerts.filter(a => a.type !== 'critical' && !a.persistent).slice(-this.maxAlerts));
    }

    this.alerts$.next(updatedAlerts);

    // Auto-close se configurado
    if (newAlert.autoClose && newAlert.autoClose > 0) {
      setTimeout(() => {
        this.dismiss(newAlert.id);
      }, newAlert.autoClose);
    }

    return newAlert;
  }

  /**
   * Alerta informativo
   */
  info(title: string, message: string, options?: Partial<MedicalAlert>): MedicalAlert {
    return this.addAlert({
      type: 'info',
      title,
      message,
      priority: 'low',
      icon: 'fa-solid fa-circle-info',
      category: 'system',
      ...options
    });
  }

  /**
   * Alerta de sucesso
   */
  success(title: string, message: string, options?: Partial<MedicalAlert>): MedicalAlert {
    return this.addAlert({
      type: 'success',
      title,
      message,
      priority: 'low',
      icon: 'fa-solid fa-circle-check',
      category: 'system',
      ...options
    });
  }

  /**
   * Alerta de atenção
   */
  warning(title: string, message: string, options?: Partial<MedicalAlert>): MedicalAlert {
    return this.addAlert({
      type: 'warning',
      title,
      message,
      priority: 'medium',
      icon: 'fa-solid fa-triangle-exclamation',
      category: 'clinical',
      ...options
    });
  }

  /**
   * Alerta de perigo
   */
  danger(title: string, message: string, options?: Partial<MedicalAlert>): MedicalAlert {
    return this.addAlert({
      type: 'danger',
      title,
      message,
      priority: 'high',
      icon: 'fa-solid fa-circle-exclamation',
      category: 'clinical',
      dismissible: false,
      ...options
    });
  }

  /**
   * Alerta crítico (máxima prioridade)
   * Usado para alergias, interações medicamentosas, valores críticos
   */
  critical(title: string, message: string, options?: Partial<MedicalAlert>): MedicalAlert {
    return this.addAlert({
      type: 'critical',
      title,
      message,
      priority: 'urgent',
      icon: 'fa-solid fa-skull-crossbones',
      category: 'clinical',
      dismissible: false,
      persistent: true,
      ...options
    });
  }

  /**
   * Alerta de alergia do paciente
   */
  allergyAlert(patientName: string, allergies: string[], patientId?: number | string): MedicalAlert {
    return this.critical(
      '⚠️ ALERGIA DETECTADA',
      `${patientName} possui alergia a: ${allergies.join(', ')}`,
      {
        patientId,
        category: 'clinical',
        actions: [
          { label: 'Ver Prontuário', action: 'view_record', variant: 'primary' },
          { label: 'Confirmar Ciência', action: 'acknowledge', variant: 'secondary' }
        ],
        metadata: { allergies }
      }
    );
  }

  /**
   * Alerta de sinal vital crítico
   */
  vitalSignAlert(
    vitalName: string, 
    value: number, 
    unit: string, 
    status: 'high' | 'low',
    patientId?: number | string
  ): MedicalAlert {
    const statusText = status === 'high' ? 'ELEVADO' : 'BAIXO';
    return this.critical(
      `🚨 ${vitalName} ${statusText}`,
      `Valor: ${value} ${unit} - Requer atenção imediata`,
      {
        patientId,
        category: 'clinical',
        actions: [
          { label: 'Registrar Intervenção', action: 'register_intervention', variant: 'primary' }
        ],
        metadata: { vitalName, value, unit, status }
      }
    );
  }

  /**
   * Alerta de interação medicamentosa
   */
  drugInteractionAlert(
    drug1: string, 
    drug2: string, 
    severity: 'moderate' | 'severe',
    patientId?: number | string
  ): MedicalAlert {
    const alertType = severity === 'severe' ? 'critical' : 'danger';
    const method = severity === 'severe' ? this.critical.bind(this) : this.danger.bind(this);
    
    return method(
      '💊 INTERAÇÃO MEDICAMENTOSA',
      `${drug1} pode interagir com ${drug2}. Severidade: ${severity === 'severe' ? 'GRAVE' : 'Moderada'}`,
      {
        patientId,
        category: 'clinical',
        actions: [
          { label: 'Ver Detalhes', action: 'view_interaction', variant: 'primary' },
          { label: 'Prosseguir', action: 'proceed', variant: 'danger' }
        ],
        metadata: { drug1, drug2, severity }
      }
    );
  }

  /**
   * Alerta de lembrete
   */
  reminder(title: string, message: string, options?: Partial<MedicalAlert>): MedicalAlert {
    return this.addAlert({
      type: 'info',
      title,
      message,
      priority: 'low',
      icon: 'fa-solid fa-bell',
      category: 'reminder',
      autoClose: 10000,
      ...options
    });
  }

  /**
   * Alerta de validação de formulário
   */
  validationError(message: string, options?: Partial<MedicalAlert>): MedicalAlert {
    return this.addAlert({
      type: 'warning',
      title: 'Validação',
      message,
      priority: 'medium',
      icon: 'fa-solid fa-exclamation',
      category: 'validation',
      autoClose: 5000,
      ...options
    });
  }

  /**
   * Remove um alerta pelo ID
   */
  dismiss(alertId: string): void {
    const currentAlerts = this.alerts$.getValue();
    this.alerts$.next(currentAlerts.filter(alert => alert.id !== alertId));
  }

  /**
   * Remove todos os alertas não críticos
   */
  clearNonCritical(): void {
    const currentAlerts = this.alerts$.getValue();
    this.alerts$.next(currentAlerts.filter(alert => alert.type === 'critical' || alert.persistent));
  }

  /**
   * Remove todos os alertas
   */
  clearAll(): void {
    this.alerts$.next([]);
  }

  /**
   * Verifica se há alertas críticos ativos
   */
  hasCriticalAlerts(): boolean {
    return this.alerts$.getValue().some(alert => alert.type === 'critical');
  }

  /**
   * Obtém alertas por categoria
   */
  getAlertsByCategory(category: MedicalAlert['category']): MedicalAlert[] {
    return this.alerts$.getValue().filter(alert => alert.category === category);
  }

  /**
   * Obtém alertas por paciente
   */
  getAlertsByPatient(patientId: number | string): MedicalAlert[] {
    return this.alerts$.getValue().filter(alert => alert.patientId === patientId);
  }
}
