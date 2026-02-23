import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Paciente } from 'src/app/util/variados/interfaces/paciente/paciente';

@Component({
  selector: 'app-tabela-editar-Paciente-Consultas',
  templateUrl: './tabela-editar-Paciente-Consultas.component.html',
  styleUrls: ['./tabela-editar-Paciente-Consultas.component.css']
})
export class TabelaEditarPacienteConsultasComponent implements OnInit {

  @Input() dadosPaciente: any;
  @Output() fechar = new EventEmitter<void>();
  @Output() selecionaPaciente = new EventEmitter<any>();
  dataSource: Paciente[] = [];
  highValue: number = 5;
  lowValue!: number;

  constructor() { }

  ngOnInit() {

    this.dataSource = this.dadosPaciente;
    console.log('Dados recebidos na tabela:', this.dataSource);
  }



  SelecionaPaciente(elemento: Paciente) {
    this.fecharTabela()
    this.selecionaPaciente.emit(elemento)
  }

  fecharTabela() {
    this.fechar.emit();
  }

  displayedColumns: string[] = [
    'paciCodigo',
    'paciNome',
    'paciCpf',
    'paciDataNacimento',
    'seleciona',
  ];

  getPaginatorData(event: PageEvent): PageEvent {
    this.lowValue = event.pageIndex * event.pageSize;
    this.highValue = this.lowValue + event.pageSize;
    this.highValue = Math.min(this.highValue, this.dataSource.length);
    return event;
  }
}
