import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Consultav2 } from 'src/app/shared/models/consultav2';
import { DIAS_SEMANA_NOMES, HoraDia, MESES_NOMES, STATUS_LABELS, classeStatus, horarioLocal } from '../agenda-calendario.calculos';

/** Visão "Dia" da agenda: faixas de hora (07h às 19h) com as consultas do dia. */
@Component({
  selector: 'app-agenda-visao-dia',
  templateUrl: './agenda-visao-dia.component.html',
  styleUrls: ['./agenda-visao-dia.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaVisaoDiaComponent {
  @Input() dataAtual: Date = new Date();
  @Input() horasDia: HoraDia[] = [];
  /** Mostra o nome do profissional em cada consulta (admin e recepção) */
  @Input() podeVerTodosProfissionais = false;

  /** Clique no cartão de uma consulta */
  @Output() consultaAberta = new EventEmitter<Consultav2>();

  readonly DIAS_SEMANA_NOMES = DIAS_SEMANA_NOMES;
  readonly MESES_NOMES = MESES_NOMES;
  readonly STATUS_LABELS = STATUS_LABELS;
  readonly getStatusClass = classeStatus;
  readonly getHorario = horarioLocal;

  abrirConsulta(consulta: Consultav2, event: MouseEvent): void {
    event.stopPropagation();
    this.consultaAberta.emit(consulta);
  }
}
