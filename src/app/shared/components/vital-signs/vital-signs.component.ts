import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Interface para um sinal vital individual
 */
export interface VitalSign {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  min?: number;
  max?: number;
  criticalMin?: number;
  criticalMax?: number;
  icon?: string;
  editable?: boolean;
}

/**
 * Status do sinal vital baseado nos ranges
 */
export type VitalStatus = 'normal' | 'attention' | 'critical';

/**
 * Componente para exibição e entrada de sinais vitais
 * Segue padrões de Healthcare UX com validação visual em tempo real
 */
@Component({
  selector: 'app-vital-signs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="hc-vital-signs">
      <div 
        *ngFor="let vital of vitals" 
        class="hc-vital-card"
        [class.hc-vital-card--normal]="getStatus(vital) === 'normal'"
        [class.hc-vital-card--attention]="getStatus(vital) === 'attention'"
        [class.hc-vital-card--critical]="getStatus(vital) === 'critical'"
        [class.hc-vital-card--editable]="vital.editable && editable"
      >
        <label class="hc-vital-card__label">
          <i *ngIf="vital.icon" [class]="vital.icon"></i>
          {{ vital.label }}
        </label>

        <!-- Modo Edição -->
        <div class="hc-vital-card__input-group" *ngIf="vital.editable && editable">
          <input 
            type="number"
            class="hc-vital-card__input"
            [value]="vital.value"
            [placeholder]="getPlaceholder(vital)"
            [step]="getStep(vital)"
            (input)="onValueChange(vital, $event)"
            [attr.aria-label]="vital.label"
            [attr.min]="vital.criticalMin"
            [attr.max]="vital.criticalMax"
          >
          <span class="hc-vital-card__unit">{{ vital.unit }}</span>
        </div>

        <!-- Modo Visualização -->
        <div class="hc-vital-card__value-group" *ngIf="!vital.editable || !editable">
          <span class="hc-vital-card__value" [class.hc-vital-card__value--empty]="vital.value === null">
            {{ vital.value !== null ? vital.value : '--' }}
          </span>
          <span class="hc-vital-card__unit">{{ vital.unit }}</span>
        </div>

        <!-- Status Badge -->
        <div 
          class="hc-vital-card__status"
          [class.hc-vital-card__status--normal]="getStatus(vital) === 'normal'"
          [class.hc-vital-card__status--attention]="getStatus(vital) === 'attention'"
          [class.hc-vital-card__status--critical]="getStatus(vital) === 'critical'"
          *ngIf="vital.value !== null && showStatus"
        >
          {{ getStatusLabel(vital) }}
        </div>

        <!-- Range Info -->
        <div class="hc-vital-card__range" *ngIf="showRange && vital.min !== undefined && vital.max !== undefined">
          <span class="text-muted text-xs">
            Normal: {{ vital.min }} - {{ vital.max }} {{ vital.unit }}
          </span>
        </div>
      </div>

      <!-- IMC Calculado (se peso e altura disponíveis) -->
      <div 
        class="hc-vital-card hc-vital-card--calculated"
        [class.hc-vital-card--normal]="getIMCStatus() === 'normal'"
        [class.hc-vital-card--attention]="getIMCStatus() === 'attention'"
        [class.hc-vital-card--critical]="getIMCStatus() === 'critical'"
        *ngIf="showIMC && canCalculateIMC()"
      >
        <label class="hc-vital-card__label">
          <i class="fa-solid fa-calculator"></i>
          IMC
        </label>
        <div class="hc-vital-card__value-group">
          <span class="hc-vital-card__value">{{ calculateIMC() | number:'1.1-1' }}</span>
          <span class="hc-vital-card__unit">kg/m²</span>
        </div>
        <div 
          class="hc-vital-card__status"
          [class.hc-vital-card__status--normal]="getIMCStatus() === 'normal'"
          [class.hc-vital-card__status--attention]="getIMCStatus() === 'attention'"
          [class.hc-vital-card__status--critical]="getIMCStatus() === 'critical'"
        >
          {{ getIMCLabel() }}
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./vital-signs.component.scss']
})
export class VitalSignsComponent implements OnChanges {
  @Input() vitals: VitalSign[] = [];
  @Input() editable = false;
  @Input() showStatus = true;
  @Input() showRange = false;
  @Input() showIMC = true;

  @Output() vitalChange = new EventEmitter<VitalSign>();
  @Output() vitalsChange = new EventEmitter<VitalSign[]>();

  private peso: number | null = null;
  private altura: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vitals']) {
      this.updatePesoAltura();
    }
  }

  private updatePesoAltura(): void {
    const pesoVital = this.vitals.find(v => v.id === 'peso');
    const alturaVital = this.vitals.find(v => v.id === 'altura');
    this.peso = pesoVital?.value ?? null;
    this.altura = alturaVital?.value ?? null;
  }

  getStatus(vital: VitalSign): VitalStatus {
    if (vital.value === null) return 'normal';

    // Verifica valores críticos primeiro
    if (vital.criticalMin !== undefined && vital.value < vital.criticalMin) {
      return 'critical';
    }
    if (vital.criticalMax !== undefined && vital.value > vital.criticalMax) {
      return 'critical';
    }

    // Verifica valores de atenção
    if (vital.min !== undefined && vital.value < vital.min) {
      return 'attention';
    }
    if (vital.max !== undefined && vital.value > vital.max) {
      return 'attention';
    }

    return 'normal';
  }

  getStatusLabel(vital: VitalSign): string {
    const status = this.getStatus(vital);
    const labels: Record<VitalStatus, string> = {
      'normal': 'Normal',
      'attention': 'Atenção',
      'critical': 'CRÍTICO'
    };
    return labels[status];
  }

  getPlaceholder(vital: VitalSign): string {
    if (vital.min !== undefined && vital.max !== undefined) {
      return `${vital.min}-${vital.max}`;
    }
    return '0';
  }

  getStep(vital: VitalSign): string {
    // Temperatura e altura precisam de decimais
    if (vital.id === 'temperatura' || vital.id === 'altura') {
      return '0.1';
    }
    return '1';
  }

  onValueChange(vital: VitalSign, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value ? parseFloat(input.value) : null;
    
    const updatedVital = { ...vital, value };
    
    // Atualiza o array local
    const index = this.vitals.findIndex(v => v.id === vital.id);
    if (index !== -1) {
      this.vitals[index] = updatedVital;
    }

    // Atualiza peso/altura para cálculo do IMC
    if (vital.id === 'peso') this.peso = value;
    if (vital.id === 'altura') this.altura = value;

    this.vitalChange.emit(updatedVital);
    this.vitalsChange.emit([...this.vitals]);
  }

  canCalculateIMC(): boolean {
    return this.peso !== null && this.altura !== null && this.peso > 0 && this.altura > 0;
  }

  calculateIMC(): number {
    if (!this.canCalculateIMC()) return 0;
    // IMC = peso / altura²
    return this.peso! / (this.altura! * this.altura!);
  }

  getIMCStatus(): VitalStatus {
    const imc = this.calculateIMC();
    if (imc < 16 || imc >= 40) return 'critical';
    if (imc < 18.5 || imc >= 30) return 'attention';
    return 'normal';
  }

  getIMCLabel(): string {
    const imc = this.calculateIMC();
    if (imc < 16) return 'Magreza Grave';
    if (imc < 17) return 'Magreza Moderada';
    if (imc < 18.5) return 'Magreza Leve';
    if (imc < 25) return 'Normal';
    if (imc < 30) return 'Sobrepeso';
    if (imc < 35) return 'Obesidade I';
    if (imc < 40) return 'Obesidade II';
    return 'Obesidade III';
  }
}

/**
 * Configuração padrão de sinais vitais para consultas médicas
 */
export const DEFAULT_VITAL_SIGNS: VitalSign[] = [
  {
    id: 'pressao_sistolica',
    label: 'PA Sistólica',
    value: null,
    unit: 'mmHg',
    min: 90,
    max: 120,
    criticalMin: 70,
    criticalMax: 180,
    icon: 'fa-solid fa-heart-pulse',
    editable: true
  },
  {
    id: 'pressao_diastolica',
    label: 'PA Diastólica',
    value: null,
    unit: 'mmHg',
    min: 60,
    max: 80,
    criticalMin: 40,
    criticalMax: 120,
    icon: 'fa-solid fa-heart-pulse',
    editable: true
  },
  {
    id: 'temperatura',
    label: 'Temperatura',
    value: null,
    unit: '°C',
    min: 36.0,
    max: 37.5,
    criticalMin: 35.0,
    criticalMax: 39.5,
    icon: 'fa-solid fa-temperature-half',
    editable: true
  },
  {
    id: 'frequencia_cardiaca',
    label: 'Freq. Cardíaca',
    value: null,
    unit: 'bpm',
    min: 60,
    max: 100,
    criticalMin: 40,
    criticalMax: 150,
    icon: 'fa-solid fa-heart',
    editable: true
  },
  {
    id: 'saturacao',
    label: 'SpO2',
    value: null,
    unit: '%',
    min: 95,
    max: 100,
    criticalMin: 90,
    criticalMax: 100,
    icon: 'fa-solid fa-lungs',
    editable: true
  },
  {
    id: 'frequencia_respiratoria',
    label: 'Freq. Resp.',
    value: null,
    unit: 'irpm',
    min: 12,
    max: 20,
    criticalMin: 8,
    criticalMax: 30,
    icon: 'fa-solid fa-wind',
    editable: true
  },
  {
    id: 'peso',
    label: 'Peso',
    value: null,
    unit: 'kg',
    icon: 'fa-solid fa-weight-scale',
    editable: true
  },
  {
    id: 'altura',
    label: 'Altura',
    value: null,
    unit: 'm',
    icon: 'fa-solid fa-ruler-vertical',
    editable: true
  }
];
