import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface RelatorioOption {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  cor: string;
}

@Component({
  selector: 'app-selecao-relatorio',
  templateUrl: './selecao-relatorio.component.html',
  styleUrls: ['./selecao-relatorio.component.css'],
})
export class SelecaoRelatorioComponent implements OnInit {
  todasOpcoes: RelatorioOption[] = [
    {
      id: '1',
      titulo: 'Solicitação de Exames',
      descricao: 'Gerar documento de solicitação de exames laboratoriais',
      icone: 'fa-solid fa-flask',
      cor: '#3b82f6'
    },
    {
      id: '2',
      titulo: 'Prescrição Médica',
      descricao: 'Gerar receituário com medicamentos prescritos',
      icone: 'fa-solid fa-prescription',
      cor: '#10b981'
    },
    {
      id: '3',
      titulo: 'Histórico Completo',
      descricao: 'Histórico de todas as consultas do paciente',
      icone: 'fa-solid fa-file-medical',
      cor: '#8b5cf6'
    },
    {
      id: '4',
      titulo: 'Atestado Médico',
      descricao: 'Documento de atestado para fins diversos',
      icone: 'fa-solid fa-file-signature',
      cor: '#f59e0b'
    },
    {
      id: '5',
      titulo: 'Imprimir Registro',
      descricao: 'Imprimir apenas este registro de consulta',
      icone: 'fa-solid fa-print',
      cor: '#64748b'
    },
    {
      id: '6',
      titulo: 'Relatório Dinâmico',
      descricao: 'Gerar relatório personalizado da consulta',
      icone: 'fa-solid fa-file-pdf',
      cor: '#ef4444'
    }
  ];

  opcoes: RelatorioOption[] = [];
  consultaNaoRealizada: boolean = false;
  isAdmin: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<SelecaoRelatorioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.consultaNaoRealizada = this.data?.consultaNaoRealizada || false;
    this.isAdmin = this.data?.isAdmin || false;
    this.filtrarOpcoes();
  }

  private filtrarOpcoes(): void {
    if (this.consultaNaoRealizada) {
      this.opcoes = this.todasOpcoes.filter(opcao => opcao.id === '3');
    } else {
      this.opcoes = this.todasOpcoes.filter(opcao => {
        if (opcao.id === '6') {
          return this.isAdmin;
        }
        return true;
      });
    }
  }

  selecionarOpcao(id: string): void {
    this.dialogRef.close(id);
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
