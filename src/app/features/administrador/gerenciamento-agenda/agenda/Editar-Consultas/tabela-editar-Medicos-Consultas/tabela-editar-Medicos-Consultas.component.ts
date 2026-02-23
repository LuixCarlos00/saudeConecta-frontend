import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Medico } from 'src/app/util/variados/interfaces/medico/medico';
import { Profissional } from 'src/app/util/variados/interfaces/medico/Profissional';

@Component({
  selector: 'app-tabela-editar-Medicos-Consultas',
  templateUrl: './tabela-editar-Medicos-Consultas.component.html',
  styleUrls: ['./tabela-editar-Medicos-Consultas.component.css'],
})
export class TabelaEditarMedicosConsultasComponent implements OnInit {
  @Input() dadosMedicos: any;
  @Output() fechar = new EventEmitter<void>();
  @Output() selecionaMedico = new EventEmitter<any>();

  clickedRows: any;
  dataSource: Profissional[] = [];
  highValue: number = 5;
  lowValue!: number;

  constructor() { }

  ngOnInit() {
    this.dataSource = this.dadosMedicos;
    console.log(this.dataSource);
  }

  // Método helper para obter especialidades formatadas
  getEspecialidades(medico: any): string {
    if (!medico.especialidades || medico.especialidades.length === 0) {
      return 'Não informado';
    }
    return medico.especialidades.map((esp: any) => esp.nome).join(', ');
  }

  SelecionaMedico(elemento: any) {
    this.fecharTabela();
    this.selecionaMedico.emit(elemento);
  }

  fecharTabela() {
    this.fechar.emit();
  }

  displayedColumns: string[] = ['position', 'Especialidade', 'MarcaConsulta'];

  getPaginatorData(event: PageEvent): PageEvent {
    this.lowValue = event.pageIndex * event.pageSize;
    this.highValue = this.lowValue + event.pageSize;
    this.highValue = Math.min(this.highValue, this.dataSource.length);
    return event;
  }
}
