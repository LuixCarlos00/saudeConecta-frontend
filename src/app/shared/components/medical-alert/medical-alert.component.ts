import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Tipos de alerta médico
 */
export type AlertType = 'info' | 'success' | 'warning' | 'danger' | 'critical';

/**
 * Interface para configuração do alerta
 */
export interface MedicalAlertConfig {
  type: AlertType;
  title: string;
  message: string;
  icon?: string;
  dismissible?: boolean;
  autoClose?: number; // ms para fechar automaticamente
  actions?: AlertAction[];
}

export interface AlertAction {
  label: string;
  action: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

/**
 * Componente de Alerta Médico
 * Usado para exibir informações críticas, avisos e notificações
 * Segue padrões de Healthcare UX para máxima visibilidade
 */
@Component({
  selector: 'app-medical-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="hc-alert"
      [class.hc-alert--info]="type === 'info'"
      [class.hc-alert--success]="type === 'success'"
      [class.hc-alert--warning]="type === 'warning'"
      [class.hc-alert--danger]="type === 'danger'"
      [class.hc-alert--critical]="type === 'critical'"
      [class.hc-alert--dismissible]="dismissible"
      role="alert"
      [attr.aria-live]="type === 'critical' ? 'assertive' : 'polite'"
    >
      <!-- Ícone -->
      <div class="hc-alert__icon">
        <i [class]="getIcon()"></i>
      </div>

      <!-- Conteúdo -->
      <div class="hc-alert__content">
        <div class="hc-alert__title" *ngIf="title">{{ title }}</div>
        <div class="hc-alert__message">{{ message }}</div>
        
        <!-- Ações -->
        <div class="hc-alert__actions" *ngIf="actions && actions.length > 0">
          <button 
            *ngFor="let action of actions"
            class="hc-btn hc-btn--sm"
            [class.hc-btn--primary]="action.variant === 'primary'"
            [class.hc-btn--secondary]="action.variant === 'secondary' || !action.variant"
            [class.hc-btn--danger]="action.variant === 'danger'"
            [class.hc-btn--ghost]="action.variant === 'ghost'"
            (click)="onActionClick(action.action)"
          >
            {{ action.label }}
          </button>
        </div>
      </div>

      <!-- Botão Fechar -->
      <button 
        *ngIf="dismissible"
        class="hc-alert__close"
        (click)="onClose()"
        aria-label="Fechar alerta"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `,
  styleUrls: ['./medical-alert.component.scss']
})
export class MedicalAlertComponent {
  @Input() type: AlertType = 'info';
  @Input() title = '';
  @Input() message = '';
  @Input() icon?: string;
  @Input() dismissible = true;
  @Input() autoClose?: number;
  @Input() actions?: AlertAction[];

  @Output() closed = new EventEmitter<void>();
  @Output() actionClicked = new EventEmitter<string>();

  private autoCloseTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    if (this.autoClose && this.autoClose > 0) {
      this.autoCloseTimer = setTimeout(() => {
        this.onClose();
      }, this.autoClose);
    }
  }

  ngOnDestroy(): void {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
    }
  }

  getIcon(): string {
    if (this.icon) return this.icon;

    const icons: Record<AlertType, string> = {
      'info': 'fa-solid fa-circle-info',
      'success': 'fa-solid fa-circle-check',
      'warning': 'fa-solid fa-triangle-exclamation',
      'danger': 'fa-solid fa-circle-exclamation',
      'critical': 'fa-solid fa-skull-crossbones'
    };

    return icons[this.type];
  }

  onClose(): void {
    this.closed.emit();
  }

  onActionClick(action: string): void {
    this.actionClicked.emit(action);
  }
}

/**
 * Componente de Container de Alertas
 * Gerencia múltiplos alertas em uma posição fixa
 */
@Component({
  selector: 'app-alert-container',
  standalone: true,
  imports: [CommonModule, MedicalAlertComponent],
  template: `
    <div class="hc-alert-container" [class]="'position-' + position">
      <app-medical-alert
        *ngFor="let alert of alerts; trackBy: trackByFn"
        [type]="alert.type"
        [title]="alert.title"
        [message]="alert.message"
        [icon]="alert.icon"
        [dismissible]="alert.dismissible !== false"
        [autoClose]="alert.autoClose"
        [actions]="alert.actions"
        (closed)="removeAlert(alert)"
        (actionClicked)="onAlertAction($event, alert)"
      ></app-medical-alert>
    </div>
  `,
  styleUrls: ['./medical-alert.component.scss']
})
export class AlertContainerComponent {
  @Input() alerts: MedicalAlertConfig[] = [];
  @Input() position: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center' = 'top-right';

  @Output() alertRemoved = new EventEmitter<MedicalAlertConfig>();
  @Output() alertAction = new EventEmitter<{ action: string; alert: MedicalAlertConfig }>();

  trackByFn(index: number, alert: MedicalAlertConfig): string {
    return `${alert.type}-${alert.title}-${index}`;
  }

  removeAlert(alert: MedicalAlertConfig): void {
    this.alertRemoved.emit(alert);
  }

  onAlertAction(action: string, alert: MedicalAlertConfig): void {
    this.alertAction.emit({ action, alert });
  }
}
