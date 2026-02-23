import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';
import { Prontuario } from 'src/app/util/variados/interfaces/Prontuario/Prontuario';

@Component({
  selector: 'app-AtestadoPaciente',
  templateUrl: './AtestadoPaciente.component.html',
  styleUrls: ['./AtestadoPaciente.component.css'],
})
export class AtestadoPacienteComponent implements OnInit {
  prontuario: Prontuario = {} as Prontuario;
  dataAtual = new Date().toISOString().split('T')[0];

  // Dados do profissional
  nomeMedico: string = '';
  crm: string = '';
  emailMedico: string = '';
  telefoneMedico: string = '';

  // Dados do paciente
  nomePaciente: string = '';
  cpfPaciente: string = '';
  dataNascimento: string = '';

  // Dados da consulta
  dataConsulta: string = '';
  horarioConsulta: string = '';
  diaSemana: string = '';

  constructor(
    public dialogRef: MatDialogRef<AtestadoPacienteComponent>,
    @Inject(MAT_DIALOG_DATA) public data:  Prontuario
  ) {}

  ngOnInit() {
    console.log('data', this.data);

    // Extrair dados do prontuário
    this.data = this.data;

    // Dados do profissional
    this.nomeMedico = this.data.profissional?.nome?.trim() || '';
    this.crm = this.data.profissional?.conselho?.trim() || '';
    this.emailMedico = this.data.profissional?.email?.trim() || '';
    this.telefoneMedico = this.data.profissional?.telefone?.trim() || '';

    // Dados do paciente
    this.nomePaciente = this.data.consulta?.pacienteNome?.trim() || '';
    this.cpfPaciente = this.data.consulta?.pacienteCpf?.trim() || '';
    this.dataNascimento = this.data.consulta?.paciente?.dataNascimento || '';

    // Dados da consulta
    const dataHora = this.data.consulta?.dataHora || '';
    if (dataHora) {
      const data = new Date(dataHora);
      this.dataConsulta = data.toLocaleDateString('pt-BR');
      this.horarioConsulta = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      this.diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'long' });
    }
  }

  // Métodos para formatar data e hora dinamicamente
  getDataAtual(): string {
    return new Date().toLocaleDateString('pt-BR');
  }

  getHoraAtual(): string {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  GerarPDF() {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = 20;
    let paginaAtual = 1;

    // Cabeçalho Moderno
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, 25, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('ATESTADO MÉDICO', pageWidth / 2, 16, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Nº: ${this.data.codigoProntuario || '000000'}`, pageWidth / 2, 20, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    y = 35;

    // Seção: Dados do Paciente
    y = this.adicionarSecaoVertical(doc, 'DADOS DO PACIENTE', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      {label: 'Nome', value: this.nomePaciente},
      {label: 'CPF', value: this.cpfPaciente},
      {label: 'Data Nascimento', value: this.dataNascimento}
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Dados da Consulta
    y = this.adicionarSecaoVertical(doc, 'DADOS DA CONSULTA', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      {label: 'Data', value: this.dataConsulta},
      {label: 'Horário', value: this.horarioConsulta},
      {label: 'Dia Semana', value: this.diaSemana}
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Médico Atendente
    y = this.adicionarSecaoVertical(doc, 'MÉDICO ATENDENTE', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      {label: 'Nome', value: `Dr. ${this.nomeMedico}`},
      {label: 'CRM', value: this.crm},
      {label: 'Email', value: this.emailMedico},
      {label: 'Telefone', value: this.telefoneMedico}
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Declaração
    const alturaCaixaDeclaracao = 40;
    const espacoNecessarioDeclaracao = 7.5 + alturaCaixaDeclaracao + 2;
    
    const resultadoDeclaracao = this.verificarEspacoAdicionarPagina(doc, y, espacoNecessarioDeclaracao, pageHeight, margin, pageWidth);
    y = resultadoDeclaracao.y;
    paginaAtual += resultadoDeclaracao.pagina;
    
    y = this.adicionarSecaoVertical(doc, 'DECLARAÇÃO', null, y, margin, pageWidth);
    
    // Desenhar caixa de texto
    doc.setLineWidth(0.1);
    doc.setDrawColor(150, 150, 150);
    doc.rect(margin, y, pageWidth - (margin * 2), alturaCaixaDeclaracao, 'D');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const declaracao = `Atesto para os devidos fins que o(a) paciente acima identificado(a) foi atendido(a) por mim na data e horário mencionados, necessitando de repouso por _______________________ .`;
    const linhas = doc.splitTextToSize(declaracao, pageWidth - (margin * 2) - 4);
    
    // Verificar se o texto cabe na caixa, senão aumentar a caixa
    const alturaTextoDeclaracao = linhas.length * 4;
    const alturaRealDeclaracao = Math.max(alturaCaixaDeclaracao, alturaTextoDeclaracao + 10);
    
    if (alturaRealDeclaracao > alturaCaixaDeclaracao) {
      const espacoAdicionalDeclaracao = alturaRealDeclaracao - alturaCaixaDeclaracao;
      const resultado2 = this.verificarEspacoAdicionarPagina(doc, y - 7.5, espacoNecessarioDeclaracao + espacoAdicionalDeclaracao, pageHeight, margin, pageWidth);
      y = resultado2.y;
      paginaAtual += resultado2.pagina;
      y = this.adicionarSecaoVertical(doc, 'DECLARAÇÃO', null, y, margin, pageWidth);
      doc.rect(margin, y, pageWidth - (margin * 2), alturaRealDeclaracao, 'D');
    }
    
    doc.text(linhas, margin + 2, y + 8);
    y += alturaRealDeclaracao + 2;

    // Seção: Assinatura
    const espacoNecessarioAssinatura = 30;
    const resultadoAssinatura = this.verificarEspacoAdicionarPagina(doc, y, espacoNecessarioAssinatura, pageHeight, margin, pageWidth);
    y = resultadoAssinatura.y;
    paginaAtual += resultadoAssinatura.pagina;
    
    y = this.adicionarSecaoVertical(doc, 'ASSINATURA', null, y, margin, pageWidth);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('Carimbo e Assinatura:', margin, y);

    doc.setLineWidth(0.2);
    doc.setDrawColor(100, 100, 100);
    doc.line(margin + 35, y, pageWidth - margin - 35, y);
    y += 10;

    doc.text(this.nomeMedico || '', pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text(`CRM: ${this.crm || ''}`, pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Rodapé
    const footerY = pageHeight - 15;
    doc.setLineWidth(0.3);
    doc.setDrawColor(52, 152, 219);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(136, 136, 136);
    doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, margin, footerY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(153, 153, 153);
    doc.text('Documento válido apenas com assinatura e carimbo', pageWidth - margin, footerY + 5, { align: 'right' });

    // Salvar
    doc.save(`Atestado_${this.data.codigoProntuario}_${this.dataAtual}.pdf`);
  }

  private adicionarSecaoVertical(doc: jsPDF, titulo: string, cor: string | null, y: number, margin: number, pageWidth: number): number {
    // Background da seção
    doc.setFillColor(248, 249, 250);
    doc.rect(margin, y, pageWidth - (margin * 2), 6, 'F');
    
    // Barra lateral (preta/cinza para visual executivo ou colorida se cor especificada)
    if (cor) {
      const rgb = this.hexToRgb(cor);
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.rect(margin, y, 2, 6, 'F');
      
      // Título da seção com cor
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
    } else {
      // Barra lateral cinza executiva
      doc.setFillColor(100, 100, 100);
      doc.rect(margin, y, 2, 6, 'F');
      
      // Título da seção preto (executivo)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
    }
    
    doc.text(titulo.toUpperCase(), margin + 4, y + 4);
    
    doc.setTextColor(0, 0, 0);
    return y + 7.5;
  }

  // Método para adicionar campos em linha (horizontal)
  private adicionarCamposHorizontal(doc: jsPDF, campos: Array<{label: string, value: string}>, y: number, margin: number, pageWidth: number): number {
    const colunas = campos.length;
    const larguraColuna = (pageWidth - (margin * 2)) / colunas;
    const alturaCampo = 8;
    
    // Desenhar linhas horizontais do formulário
    doc.setLineWidth(0.1);
    doc.setDrawColor(150, 150, 150);
    
    campos.forEach((campo, index) => {
      const x = margin + (index * larguraColuna);
      
      // Linha superior do campo
      doc.line(x, y - 2, x + larguraColuna, y - 2);
      
      // Linha inferior do campo
      doc.line(x, y + alturaCampo - 1, x + larguraColuna, y + alturaCampo - 1);
      
      // Linhas verticais separadoras (exceto na última coluna)
      if (index < colunas - 1) {
        doc.line(x + larguraColuna, y - 2, x + larguraColuna, y + alturaCampo - 1);
      }
    });
    
    // Labels
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(102, 102, 102);
    campos.forEach((campo, index) => {
      const x = margin + (index * larguraColuna) + 2;
      doc.text(campo.label.toUpperCase(), x, y);
    });
    
    // Values
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    campos.forEach((campo, index) => {
      const x = margin + (index * larguraColuna) + 2;
      const valor = campo.value || '-';
      const texto = doc.splitTextToSize(valor, larguraColuna - 4);
      doc.text(texto, x, y + 4);
    });
    
    return y + alturaCampo + 2;
  }

  // Método para verificar espaço e adicionar nova página se necessário
  private verificarEspacoAdicionarPagina(doc: jsPDF, y: number, espacoNecessario: number, pageHeight: number, margin: number, pageWidth: number): { y: number, pagina: number } {
    const espacoDisponivel = pageHeight - margin - 20; // 20mm para rodapé
    if (y + espacoNecessario > espacoDisponivel) {
      doc.addPage();
      
      // Adicionar cabeçalho na nova página
      this.adicionarCabecalhoPagina(doc, pageWidth);
      
      return { y: 35, pagina: 1 }; // Reiniciar Y após o cabeçalho e incrementar página
    }
    return { y: y, pagina: 0 };
  }

  // Método para adicionar cabeçalho em páginas adicionais
  private adicionarCabecalhoPagina(doc: jsPDF, pageWidth: number): void {
    // Cabeçalho Moderno
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, 25, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('ATESTADO MÉDICO', pageWidth / 2, 16, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Nº: ${this.data.codigoProntuario || '000000'} - Continuação`, pageWidth / 2, 20, { align: 'center' });

    doc.setTextColor(0, 0, 0);
  }

  private hexToRgb(hex: string | null): {r: number, g: number, b: number} {
    if (!hex) return {r: 0, g: 0, b: 0};
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : {r: 0, g: 0, b: 0};
  }
}
