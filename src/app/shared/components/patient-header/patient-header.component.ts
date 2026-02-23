import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Interface para dados do paciente no header
 * Exibe informações críticas que devem estar sempre visíveis
 */
export interface PatientHeaderData {
  id: number | string;
  nome: string;
  idade: number;
  sexo: 'M' | 'F' | 'Outro';
  dataNascimento: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  tipoSanguineo?: string;
  foto?: string;
  convenio?: string;
  carteirinha?: string;
  alergias?: string[];
  condicoes?: string[];
  medicamentosEmUso?: string[];
}

@Component({
  selector: 'app-patient-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hc-patient-header" [class.hc-patient-header--compact]="compact" *ngIf="patient">
      <!-- Alertas Críticos (Alergias) - Sempre no topo -->
      <div class="hc-critical-alerts" *ngIf="patient.alergias && patient.alergias.length > 0">
        <div class="hc-allergy-badge" *ngFor="let alergia of patient.alergias">
          <span class="hc-allergy-badge__icon">🚫</span>
          <strong>ALERGIA:</strong> {{ alergia }}
        </div>
      </div>

      <!-- Informações Principais -->
      <div class="hc-patient-header__main">
        <div class="hc-patient-header__photo-container">
          <img 
            [src]="patient.foto || 'assets/images/default-avatar.png'" 
            [alt]="patient.nome"
            class="hc-patient-header__photo"
            (error)="onImageError($event)"
          >
          <span 
            class="hc-patient-header__blood-type" 
            *ngIf="patient.tipoSanguineo"
            [title]="'Tipo Sanguíneo: ' + patient.tipoSanguineo"
          >
            {{ patient.tipoSanguineo }}
          </span>
        </div>

        <div class="hc-patient-header__identity">
          <h1 class="hc-patient-header__name">{{ patient.nome }}</h1>
          <div class="hc-patient-header__meta">
            <span class="hc-patient-header__id">
              <i class="fa-solid fa-id-card"></i>
              ID: {{ patient.id }}
            </span>
            <span>{{ patient.idade }} anos</span>
            <span>{{ getSexoLabel(patient.sexo) }}</span>
            <span *ngIf="patient.dataNascimento">
              <i class="fa-solid fa-cake-candles"></i>
              {{ patient.dataNascimento }}
            </span>
            <span *ngIf="patient.tipoSanguineo" class="d-sm-none">
              <i class="fa-solid fa-droplet"></i>
              {{ patient.tipoSanguineo }}
            </span>
          </div>

          <!-- Condições Crônicas -->
          <div class="hc-patient-header__conditions" *ngIf="patient.condicoes && patient.condicoes.length > 0">
            <span 
              class="hc-badge hc-badge--warning hc-badge--lg" 
              *ngFor="let condicao of patient.condicoes"
            >
              <i class="fa-solid fa-triangle-exclamation"></i>
              {{ condicao }}
            </span>
          </div>

          <!-- Medicamentos em Uso -->
          <div class="hc-patient-header__medications" *ngIf="patient.medicamentosEmUso && patient.medicamentosEmUso.length > 0 && !compact">
            <span class="hc-badge hc-badge--info" *ngFor="let med of patient.medicamentosEmUso">
              <i class="fa-solid fa-pills"></i>
              {{ med }}
            </span>
          </div>
        </div>

        <!-- Ações Rápidas -->
        <div class="hc-patient-header__actions" *ngIf="showActions">
          <button 
            class="hc-btn hc-btn--icon hc-btn--ghost" 
            title="Nova Prescrição"
            (click)="onAction.emit('prescricao')"
          >
            <i class="fa-solid fa-file-prescription"></i>
          </button>
          <button 
            class="hc-btn hc-btn--icon hc-btn--ghost" 
            title="Solicitar Exame"
            (click)="onAction.emit('exame')"
          >
            <i class="fa-solid fa-flask"></i>
          </button>
          <button 
            class="hc-btn hc-btn--icon hc-btn--ghost" 
            title="Gerar Atestado"
            (click)="onAction.emit('atestado')"
          >
            <i class="fa-solid fa-file-medical"></i>
          </button>
          <button 
            class="hc-btn hc-btn--icon hc-btn--ghost" 
            title="Imprimir"
            (click)="onAction.emit('imprimir')"
          >
            <i class="fa-solid fa-print"></i>
          </button>
          <button 
            class="hc-btn hc-btn--icon hc-btn--ghost" 
            title="Mais Opções"
            (click)="onAction.emit('mais')"
          >
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
        </div>
      </div>

      <!-- Informações de Contato e Convênio (expandido) -->
      <div class="hc-patient-header__details" *ngIf="!compact && showDetails">
        <div class="hc-patient-header__contact">
          <span *ngIf="patient.telefone">
            <i class="fa-solid fa-phone"></i>
            {{ patient.telefone }}
          </span>
          <span *ngIf="patient.email">
            <i class="fa-solid fa-envelope"></i>
            {{ patient.email }}
          </span>
        </div>
        <div class="hc-patient-header__insurance" *ngIf="patient.convenio">
          <span>
            <i class="fa-solid fa-id-badge"></i>
            {{ patient.convenio }}
          </span>
          <span *ngIf="patient.carteirinha" class="text-muted">
            Carteirinha: {{ patient.carteirinha }}
          </span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./patient-header.component.scss']
})
export class PatientHeaderComponent {
  @Input() patient: PatientHeaderData | null = null;
  @Input() compact = false;
  @Input() showActions = true;
  @Input() showDetails = true;
  
  @Output() onAction = new EventEmitter<string>();

  getSexoLabel(sexo: string | undefined): string {
    const labels: Record<string, string> = {
      'M': 'Masculino',
      'F': 'Feminino',
      'Outro': 'Outro'
    };
    return labels[sexo || ''] || 'Não informado';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-avatar.png';
  }
}
