import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MedicalAlertService, MedicalAlert } from '../../../core/services/medical-alert.service';

/**
 * Container de Alertas Toast
 * 
 * Exibe alertas médicos em uma posição fixa na tela.
 * Deve ser incluído no componente raiz (AppComponent).
 * 
 * @example
 * ```html
 * <!-- No app.component.html -->
 * <router-outlet></router-outlet>
 * <app-alert-toast-container></app-alert-toast-container>
 * ```
 */
@Component({
  selector: 'app-alert-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="alert-toast-container" [class]="'position-' + position">
      <div 
        *ngFor="let alert of alerts; trackBy: trackByFn"
        class="alert-toast"
        [class.alert-toast--info]="alert.type === 'info'"
        [class.alert-toast--success]="alert.type === 'success'"
        [class.alert-toast--warning]="alert.type === 'warning'"
        [class.alert-toast--danger]="alert.type === 'danger'"
        [class.alert-toast--critical]="alert.type === 'critical'"
        role="alert"
        [attr.aria-live]="alert.type === 'critical' ? 'assertive' : 'polite'"
      >
        <!-- Ícone -->
        <div class="alert-toast__icon">
          <i [class]="alert.icon || getDefaultIcon(alert.type)"></i>
        </div>

        <!-- Conteúdo -->
        <div class="alert-toast__content">
          <div class="alert-toast__title">{{ alert.title }}</div>
          <div class="alert-toast__message">{{ alert.message }}</div>
          
          <!-- Ações -->
          <div class="alert-toast__actions" *ngIf="alert.actions && alert.actions.length > 0">
            <button 
              *ngFor="let action of alert.actions"
              class="alert-toast__action-btn"
              [class.alert-toast__action-btn--primary]="action.variant === 'primary'"
              [class.alert-toast__action-btn--danger]="action.variant === 'danger'"
              (click)="onActionClick(alert, action.action)"
            >
              {{ action.label }}
            </button>
          </div>
        </div>

        <!-- Botão Fechar -->
        <button 
          *ngIf="alert.dismissible !== false"
          class="alert-toast__close"
          (click)="dismiss(alert.id)"
          aria-label="Fechar alerta"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./alert-toast-container.component.scss']
})
export class AlertToastContainerComponent implements OnInit, OnDestroy {
  alerts: MedicalAlert[] = [];
  position: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center' = 'top-right';

  private readonly destroy$ = new Subject<void>();

  constructor(private alertService: MedicalAlertService) {}

  ngOnInit(): void {
    this.alertService.alerts
      .pipe(takeUntil(this.destroy$))
      .subscribe(alerts => {
        this.alerts = alerts;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByFn(index: number, alert: MedicalAlert): string {
    return alert.id;
  }

  getDefaultIcon(type: string): string {
    const icons: Record<string, string> = {
      'info': 'fa-solid fa-circle-info',
      'success': 'fa-solid fa-circle-check',
      'warning': 'fa-solid fa-triangle-exclamation',
      'danger': 'fa-solid fa-circle-exclamation',
      'critical': 'fa-solid fa-skull-crossbones'
    };
    return icons[type] || icons['info'];
  }

  dismiss(alertId: string): void {
    this.alertService.dismiss(alertId);
  }

  onActionClick(alert: MedicalAlert, action: string): void {
    // Emite evento para ser tratado pelo componente pai ou serviço
    console.log('Alert action:', action, alert);
    
    // Fecha o alerta após ação (exceto críticos)
    if (alert.type !== 'critical') {
      this.dismiss(alert.id);
    }
  }
}
