import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Consultav2 } from 'src/app/shared/models/consultav2';
import { DIAS_SEMANA_NOMES, DiaCalendario, HoraDia, classeStatus, horarioLocal } from '../agenda-calendario.calculos';

/** Visão "Semana" da agenda: sete colunas (domingo a sábado) com as consultas de cada dia. */
@Component({
  selector: 'app-agenda-visao-semana',
  templateUrl: './agenda-visao-semana.component.html',
  styleUrls: ['./agenda-visao-semana.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaVisaoSemanaComponent {
  @Input() diasSemana: DiaCalendario[] = [];
  /** Faixas de hora que formam a coluna de horários */
  @Input() horasDia: HoraDia[] = [];
  /** Mostra o nome do profissional em cada consulta (admin e recepção) */
  @Input() podeVerTodosProfissionais = false;

  /** Clique no cabeçalho do dia */
  @Output() diaSelecionado = new EventEmitter<DiaCalendario>();
  /** Clique no cartão de uma consulta */
  @Output() consultaAberta = new EventEmitter<Consultav2>();

  readonly DIAS_SEMANA_NOMES = DIAS_SEMANA_NOMES;
  readonly getStatusClass = classeStatus;
  readonly getHorario = horarioLocal;

  selecionarDia(dia: DiaCalendario): void {
    this.diaSelecionado.emit(dia);
  }

  abrirConsulta(consulta: Consultav2, event: MouseEvent): void {
    event.stopPropagation();
    this.consultaAberta.emit(consulta);
  }
}
