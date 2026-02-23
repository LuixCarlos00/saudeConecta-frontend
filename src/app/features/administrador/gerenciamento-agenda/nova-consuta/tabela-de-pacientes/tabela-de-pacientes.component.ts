import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Paciente } from 'src/app/util/variados/interfaces/paciente/paciente';

@Component({
  selector: 'app-tabela-de-pacientes',
  templateUrl: './tabela-de-pacientes.component.html',
  styleUrls: ['./tabela-de-pacientes.component.css'],
})
export class TabelaDePacientesComponent implements OnInit {


  dataSource: Paciente[] = [];
  highValue: number = 5;
  lowValue!: number;

  constructor(public dialogRef: MatDialogRef<TabelaDePacientesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }


  ngOnInit() {
    this.dataSource = this.data;
  }

  // geração de relatorio dinamico escolhe quais campos que, ja queixa definido alguns campos por padrao


  SelecionaPaciente(elemento: Paciente) {
    this.dialogRef.close(elemento);
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
