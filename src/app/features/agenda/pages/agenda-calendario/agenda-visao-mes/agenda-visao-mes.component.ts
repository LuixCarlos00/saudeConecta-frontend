import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Consultav2 } from 'src/app/shared/models/consultav2';
import { DIAS_SEMANA_NOMES, DiaCalendario, classeStatus, horarioLocal } from '../agenda-calendario.calculos';

/** Visão "Mês" da agenda: grade de 6 semanas com até 3 consultas por dia. */
@Component({
  selector: 'app-agenda-visao-mes',
  templateUrl: './agenda-visao-mes.component.html',
  styleUrls: ['./agenda-visao-mes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaVisaoMesComponent {
  @Input() diasCalendario: DiaCalendario[] = [];

  /** Clique na célula do dia */
  @Output() diaSelecionado = new EventEmitter<DiaCalendario>();
  /** Clique no chip de uma consulta */
  @Output() consultaAberta = new EventEmitter<Consultav2>();

  readonly DIAS_SEMANA_NOMES = DIAS_SEMANA_NOMES;
  readonly getStatusClass = classeStatus;
  readonly getHorario = horarioLocal;

  selecionarDia(dia: DiaCalendario): void {
    this.diaSelecionado.emit(dia);
  }

  /** O clique na consulta não deve selecionar também o dia que a contém. */
  abrirConsulta(consulta: Consultav2, event: MouseEvent): void {
    event.stopPropagation();
    this.consultaAberta.emit(consulta);
  }
}
