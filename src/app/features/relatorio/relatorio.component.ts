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
  selector: 'app-relatorio',
  templateUrl: './relatorio.component.html',
  styleUrls: ['./relatorio.component.css'],
})
export class RelatorioComponent implements OnInit {
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
      id: '4',
      titulo: 'Atestado Médico',
      descricao: 'Documento de atestado para fins diversos',
      icone: 'fa-solid fa-file-signature',
      cor: '#f59e0b'
    },
    {
      id: '3',
      titulo: 'Histórico Completo',
      descricao: 'Histórico de todas as consultas do paciente',
      icone: 'fa-solid fa-file-medical',
      cor: '#8b5cf6'
    },
    {
      id: '5',
      titulo: 'Imprimir Registro',
      descricao: 'Imprimir apenas este registro de consulta',
      icone: 'fa-solid fa-print',
      cor: '#64748b'
    },
    {
      id: '7',
      titulo: 'Comprovante de Pagamento',
      descricao: 'Gerar comprovante de pagamento da consulta',
      icone: 'fa-solid fa-file-invoice-dollar',
      cor: '#14b8a6'
    },
    // {
    //   id: '6',
    //   titulo: 'Relatório Dinâmico',
    //   descricao: 'Gerar relatório personalizado da consulta',
    //   icone: 'fa-solid fa-file-pdf',
    //   cor: '#ef4444'
    // },
    {
      id: '8',
      titulo: 'Questionário de Saúde',
      descricao: 'Visualizar respostas e assinatura do questionário',
      icone: 'fa-solid fa-clipboard-question',
      cor: '#0ea5e9'
    },
    {
      id: '9',
      titulo: 'Planejamento Odontológico',
      descricao: 'Visualizar procedimentos e assinatura do planejamento',
      icone: 'fa-solid fa-list-check',
      cor: '#d946ef'
    },
    {
      id: '10',
      titulo: 'Planejamento Médico',
      descricao: 'Visualizar procedimentos e assinatura do planejamento',
      icone: 'fa-solid fa-list-check',
      cor: '#3b82f6'
    }
  ];

  opcoes: RelatorioOption[] = [];
  consultaNaoRealizada: boolean = false;
  isAdmin: boolean = false;
  isProfissional: boolean = false;
  tipoProfissional: string = ''; // 'MEDICO' ou 'DENTISTA'

  constructor(
    public dialogRef: MatDialogRef<RelatorioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.consultaNaoRealizada = this.data?.consultaNaoRealizada || false;
    this.isAdmin = this.data?.isAdmin || false;
    this.isProfissional = this.data?.isProfissional || false;
    this.tipoProfissional = this.data?.tipoProfissional || '';
    this.filtrarOpcoes();
  }

  private filtrarOpcoes(): void {
    const statusConsulta = this.data?.consulta?.status;
    
    // Se estiver AGENDADA, CONFIRMADA ou CANCELADA - apenas histórico completo
    if (statusConsulta === 'AGENDADA' || statusConsulta === 'CONFIRMADA' || statusConsulta === 'CANCELADA') {
      this.opcoes = this.todasOpcoes.filter(opcao => opcao.id === '3');
    } 
    // Se estiver REALIZADA ou PAGO - todas as opções de acordo com o tipo de usuário
    else if (statusConsulta === 'REALIZADA' || statusConsulta === 'PAGO') {
      this.opcoes = this.todasOpcoes.filter(opcao => {
        // Relatório dinâmico apenas para admin
        if (opcao.id === '6') {
          return this.isAdmin;
        }
        // Comprovante de pagamento não para profissional
        if (opcao.id === '7') {
          return !this.isProfissional;
        }
        // Planejamento odontológico apenas para dentistas ou admin visualizando dentista
        if (opcao.id === '9') {
          return this.tipoProfissional === 'DENTISTA' || (this.isAdmin && this.tipoProfissional === 'DENTISTA');
        }
        // Planejamento médico apenas para médicos ou admin visualizando médico
        if (opcao.id === '10') {
          return this.tipoProfissional === 'MEDICO' || (this.isAdmin && this.tipoProfissional === 'MEDICO');
        }
        return true;
      });
    }
    // Para qualquer outro status - mantém a lógica anterior
    else {
      this.opcoes = this.todasOpcoes.filter(opcao => {
        if (opcao.id === '6') {
          return this.isAdmin;
        }
        if (opcao.id === '7') {
          return !this.isProfissional;
        }
        if (opcao.id === '9') {
          return this.tipoProfissional === 'DENTISTA' || (this.isAdmin && this.tipoProfissional === 'DENTISTA');
        }
        if (opcao.id === '10') {
          return this.tipoProfissional === 'MEDICO' || (this.isAdmin && this.tipoProfissional === 'MEDICO');
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
