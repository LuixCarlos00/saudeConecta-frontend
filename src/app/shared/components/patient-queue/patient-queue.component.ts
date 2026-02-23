import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Status possíveis de um paciente na fila
 */
export type QueueStatus = 
  | 'scheduled'      // Agendado
  | 'confirmed'      // Confirmado
  | 'waiting'        // Aguardando
  | 'in-progress'    // Em atendimento
  | 'completed'      // Concluído
  | 'cancelled'      // Cancelado
  | 'no-show'        // Não compareceu
  | 'delayed';       // Atrasado

/**
 * Interface para item da fila de pacientes
 */
export interface QueueItem {
  id: number | string;
  pacienteId: number | string;
  pacienteNome: string;
  pacienteIdade?: number;
  pacienteSexo?: 'M' | 'F' | 'Outro';
  pacienteFoto?: string;
  horarioAgendado: string;
  horarioChegada?: string;
  status: QueueStatus;
  tipoConsulta?: string;
  especialidade?: string;
  medicoNome?: string;
  alergias?: string[];
  observacao?: string;
  prioridade?: 'urgent' | 'high' | 'medium' | 'low' | 'routine';
}

@Component({
  selector: 'app-patient-queue',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hc-patient-queue">
      <!-- Header da Fila -->
      <div class="hc-patient-queue__header" *ngIf="showHeader">
        <h3 class="hc-patient-queue__title">
          <i class="fa-solid fa-users"></i>
          {{ title }}
        </h3>
        <div class="hc-patient-queue__stats">
          <span class="hc-badge hc-badge--info">
            {{ getWaitingCount() }} aguardando
          </span>
          <span class="hc-badge hc-badge--success" *ngIf="getInProgressCount() > 0">
            {{ getInProgressCount() }} em atendimento
          </span>
        </div>
      </div>

      <!-- Lista de Pacientes -->
      <div class="hc-patient-queue__list">
        <div 
          *ngFor="let item of sortedQueue; let i = index; trackBy: trackByFn"
          class="hc-queue-item"
          [class.hc-queue-item--current]="item.status === 'in-progress'"
          [class.hc-queue-item--waiting]="item.status === 'waiting'"
          [class.hc-queue-item--delayed]="item.status === 'delayed'"
          [class.hc-queue-item--completed]="item.status === 'completed'"
          [class.hc-queue-item--cancelled]="item.status === 'cancelled'"
          [class.hc-queue-item--selected]="selectedId === item.id"
          (click)="onSelect(item)"
          [attr.role]="'button'"
          [attr.tabindex]="0"
          (keydown.enter)="onSelect(item)"
          (keydown.space)="onSelect(item)"
        >
          <!-- Indicador de Posição -->
          <div class="hc-queue-item__position" *ngIf="showPosition && item.status === 'waiting'">
            {{ i + 1 }}
          </div>

          <!-- Foto do Paciente -->
          <div class="hc-queue-item__avatar">
            <img 
              [src]="item.pacienteFoto || 'assets/images/default-avatar.png'" 
              [alt]="item.pacienteNome"
              (error)="onImageError($event)"
            >
            <span 
              class="hc-queue-item__priority-indicator"
              *ngIf="item.prioridade && item.prioridade !== 'routine'"
              [class]="'priority-' + item.prioridade"
              [title]="getPriorityLabel(item.prioridade)"
            ></span>
          </div>

          <!-- Informações do Paciente -->
          <div class="hc-queue-item__info">
            <div class="hc-queue-item__name">
              {{ item.pacienteNome }}
              <span class="hc-queue-item__age" *ngIf="item.pacienteIdade">
                {{ item.pacienteIdade }} anos
              </span>
            </div>
            
            <div class="hc-queue-item__details">
              <span *ngIf="item.tipoConsulta" class="hc-queue-item__type">
                {{ item.tipoConsulta }}
              </span>
              <span *ngIf="item.medicoNome" class="hc-queue-item__doctor">
                <i class="fa-solid fa-user-doctor"></i>
                {{ item.medicoNome }}
              </span>
            </div>

            <!-- Alertas de Alergia -->
            <div class="hc-queue-item__alerts" *ngIf="item.alergias && item.alergias.length > 0">
              <span class="hc-badge hc-badge--danger hc-badge--sm" *ngFor="let alergia of item.alergias.slice(0, 2)">
                🚫 {{ alergia }}
              </span>
              <span class="hc-badge hc-badge--danger hc-badge--sm" *ngIf="item.alergias.length > 2">
                +{{ item.alergias.length - 2 }}
              </span>
            </div>
          </div>

          <!-- Horário e Status -->
          <div class="hc-queue-item__time-status">
            <div class="hc-queue-item__time">
              <i class="fa-regular fa-clock"></i>
              {{ item.horarioAgendado }}
            </div>
            <div 
              class="hc-queue-item__status"
              [class]="'status-' + item.status"
            >
              {{ getStatusLabel(item.status) }}
            </div>
            <div class="hc-queue-item__wait-time" *ngIf="item.status === 'waiting' && item.horarioChegada">
              <i class="fa-solid fa-hourglass-half"></i>
              {{ getWaitTime(item.horarioChegada) }}
            </div>
          </div>

          <!-- Ações -->
          <div class="hc-queue-item__actions" *ngIf="showActions">
            <button 
              class="hc-btn hc-btn--sm hc-btn--primary"
              *ngIf="item.status === 'waiting'"
              (click)="onAction('atender', item, $event)"
              title="Iniciar Atendimento"
            >
              <i class="fa-solid fa-play"></i>
            </button>
            <button 
              class="hc-btn hc-btn--sm hc-btn--ghost"
              (click)="onAction('detalhes', item, $event)"
              title="Ver Detalhes"
            >
              <i class="fa-solid fa-eye"></i>
            </button>
            <button 
              class="hc-btn hc-btn--sm hc-btn--ghost"
              (click)="onAction('menu', item, $event)"
              title="Mais Opções"
            >
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
          </div>
        </div>

        <!-- Estado Vazio -->
        <div class="hc-patient-queue__empty" *ngIf="queue.length === 0">
          <i class="fa-solid fa-calendar-check"></i>
          <p>{{ emptyMessage }}</p>
        </div>
      </div>

      <!-- Footer com Ações -->
      <div class="hc-patient-queue__footer" *ngIf="showFooter && queue.length > 0">
        <button class="hc-btn hc-btn--link" (click)="onViewAll.emit()">
          Ver agenda completa
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./patient-queue.component.scss']
})
export class PatientQueueComponent {
  @Input() queue: QueueItem[] = [];
  @Input() title = 'Fila de Pacientes';
  @Input() emptyMessage = 'Nenhum paciente na fila';
  @Input() showHeader = true;
  @Input() showFooter = true;
  @Input() showActions = true;
  @Input() showPosition = true;
  @Input() selectedId: number | string | null = null;

  @Output() itemSelected = new EventEmitter<QueueItem>();
  @Output() itemAction = new EventEmitter<{ action: string; item: QueueItem }>();
  @Output() onViewAll = new EventEmitter<void>();

  get sortedQueue(): QueueItem[] {
    // Ordena: em atendimento primeiro, depois aguardando por horário, depois outros
    return [...this.queue].sort((a, b) => {
      const statusOrder: Record<QueueStatus, number> = {
        'in-progress': 0,
        'delayed': 1,
        'waiting': 2,
        'confirmed': 3,
        'scheduled': 4,
        'completed': 5,
        'cancelled': 6,
        'no-show': 7
      };

      const orderA = statusOrder[a.status] ?? 99;
      const orderB = statusOrder[b.status] ?? 99;

      if (orderA !== orderB) return orderA - orderB;

      // Mesmo status: ordena por horário
      return a.horarioAgendado.localeCompare(b.horarioAgendado);
    });
  }

  trackByFn(index: number, item: QueueItem): number | string {
    return item.id;
  }

  getStatusLabel(status: QueueStatus): string {
    const labels: Record<QueueStatus, string> = {
      'scheduled': 'Agendado',
      'confirmed': 'Confirmado',
      'waiting': 'Aguardando',
      'in-progress': 'Em Atendimento',
      'completed': 'Concluído',
      'cancelled': 'Cancelado',
      'no-show': 'Não Compareceu',
      'delayed': 'Atrasado'
    };
    return labels[status] || status;
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'urgent': 'Urgente',
      'high': 'Alta Prioridade',
      'medium': 'Média Prioridade',
      'low': 'Baixa Prioridade',
      'routine': 'Rotina'
    };
    return labels[priority] || priority;
  }

  getWaitingCount(): number {
    return this.queue.filter(item => item.status === 'waiting').length;
  }

  getInProgressCount(): number {
    return this.queue.filter(item => item.status === 'in-progress').length;
  }

  getWaitTime(horarioChegada: string): string {
    try {
      const [hours, minutes] = horarioChegada.split(':').map(Number);
      const chegada = new Date();
      chegada.setHours(hours, minutes, 0, 0);
      
      const agora = new Date();
      const diffMs = agora.getTime() - chegada.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);

      if (diffMinutes < 0) return '0 min';
      if (diffMinutes < 60) return `${diffMinutes} min`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      const remainingMinutes = diffMinutes % 60;
      return `${diffHours}h ${remainingMinutes}min`;
    } catch {
      return '--';
    }
  }

  onSelect(item: QueueItem): void {
    this.itemSelected.emit(item);
  }

  onAction(action: string, item: QueueItem, event: Event): void {
    event.stopPropagation();
    this.itemAction.emit({ action, item });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-avatar.png';
  }
}
