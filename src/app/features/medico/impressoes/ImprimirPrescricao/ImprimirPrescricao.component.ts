import { Prontuario } from 'src/app/util/variados/interfaces/Prontuario/Prontuario';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-ImprimirPrescricao',
  templateUrl: './ImprimirPrescricao.component.html',
  styleUrls: ['./ImprimirPrescricao.component.css']
})
export class ImprimirPrescricaoComponent implements OnInit {
   dataAtual = new Date().toISOString().split('T')[0];

  // Dados do profissional
  nomeMedico: string = '';
  crm: string = '';
  emailMedico: string = '';
  telefoneMedico: string = '';

  // Dados do paciente
  nomePaciente: string = '';
  cpfPaciente: string = '';

  // Dados da prescrição
  dataPrescricao: string = '';
  tituloPrescricao: string = '';
  prescricao: string = '';

  constructor(
    public dialogRef: MatDialogRef<ImprimirPrescricaoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Prontuario) {}

  ngOnInit() {
    console.log('data', this.data);

    // Extrair dados do prontuário

    // Dados do profissional
    this.nomeMedico = this.data.profissional?.nome?.trim() || '';
    this.crm = this.data.profissional?.conselho?.trim() || '';
    this.emailMedico = this.data.profissional?.email?.trim() || '';
    this.telefoneMedico = this.data.profissional?.telefone?.trim() || '';

    // Dados do paciente
    this.nomePaciente = this.data.consulta?.pacienteNome?.trim() || '';
    this.cpfPaciente = this.data.consulta?.pacienteCpf?.trim() || '';

    // Dados da prescrição
    this.dataPrescricao = this.data.dataPrescricao || this.dataAtual;
    this.tituloPrescricao = this.data.tituloPrescricao?.trim() || 'PRESCRIÇÃO MÉDICA';
    this.prescricao = this.data.prescricao?.trim() || 'Medicamentos conforme prescrição médica.';
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
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PRESCRIÇÃO MÉDICA', pageWidth / 2, 16, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Nº: ${this.data.codigoProntuario || '000000'}`, pageWidth / 2, 20, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y = 35;

    // Seção: Dados do Paciente
    y = this.adicionarSecaoVertical(doc, 'DADOS DO PACIENTE', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      {label: 'Nome', value: this.nomePaciente},
      {label: 'CPF', value: this.cpfPaciente}
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Médico Prescritor
    y = this.adicionarSecaoVertical(doc, 'MÉDICO PRESCRITOR', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      {label: 'Nome', value: `Dr. ${this.nomeMedico}`},
      {label: 'CRM', value: this.crm},
      {label: 'Email', value: this.emailMedico},
      {label: 'Telefone', value: this.telefoneMedico}
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Informações da Prescrição
    y = this.adicionarSecaoVertical(doc, 'INFORMAÇÕES DA PRESCRIÇÃO', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      {label: 'Título', value: this.tituloPrescricao},
      {label: 'Data Prescrição', value: this.dataPrescricao}
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Medicamentos Prescritos
    const alturaCaixaPrescricao = 60;
    const espacoNecessarioPrescricao = 7.5 + alturaCaixaPrescricao + 2;
    
    const resultadoPrescricao = this.verificarEspacoAdicionarPagina(doc, y, espacoNecessarioPrescricao, pageHeight, margin, pageWidth);
    y = resultadoPrescricao.y;
    paginaAtual += resultadoPrescricao.pagina;
    
    y = this.adicionarSecaoVertical(doc, 'MEDICAMENTOS PRESCRITOS', null, y, margin, pageWidth);
    
    // Desenhar caixa de texto
    doc.setLineWidth(0.1);
    doc.setDrawColor(150, 150, 150);
    doc.rect(margin, y, pageWidth - (margin * 2), alturaCaixaPrescricao, 'D');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const linhasPrescricao = doc.splitTextToSize(this.prescricao, pageWidth - (margin * 2) - 4);
    
    // Verificar se o texto cabe na caixa, senão aumentar a caixa
    const alturaTextoPrescricao = linhasPrescricao.length * 4;
    const alturaRealPrescricao = Math.max(alturaCaixaPrescricao, alturaTextoPrescricao + 10);
    
    if (alturaRealPrescricao > alturaCaixaPrescricao) {
      const espacoAdicionalPrescricao = alturaRealPrescricao - alturaCaixaPrescricao;
      const resultado2 = this.verificarEspacoAdicionarPagina(doc, y - 7.5, espacoNecessarioPrescricao + espacoAdicionalPrescricao, pageHeight, margin, pageWidth);
      y = resultado2.y;
      paginaAtual += resultado2.pagina;
      y = this.adicionarSecaoVertical(doc, 'MEDICAMENTOS PRESCRITOS', null, y, margin, pageWidth);
      doc.rect(margin, y, pageWidth - (margin * 2), alturaRealPrescricao, 'D');
    }
    
    doc.text(linhasPrescricao, margin + 2, y + 8);
    y += alturaRealPrescricao + 2;

    // Aviso
    const espacoNecessarioAviso = 12;
    const resultadoAviso = this.verificarEspacoAdicionarPagina(doc, y, espacoNecessarioAviso, pageHeight, margin, pageWidth);
    y = resultadoAviso.y;
    paginaAtual += resultadoAviso.pagina;
    
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(150, 150, 150);
    doc.rect(margin, y, pageWidth - (margin * 2), 10, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Uso conforme orientação médica. Não interrompa o tratamento sem consultar seu médico.', pageWidth / 2, y + 6, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 12;

    // Rodapé
    const footerY = pageHeight - 15;
    doc.setLineWidth(0.3);
    doc.setDrawColor(52, 152, 219);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(136, 136, 136);
    doc.text(`Emitido em: ${this.dataAtual}`, margin, footerY + 5);
    doc.setFontSize(6);
    doc.text('Documento válido para apresentação em farmácias e estabelecimentos de saúde.', margin, footerY + 9);

    // Salvar
    doc.save(`Prescricao_${this.data.codigoProntuario}_${this.dataPrescricao}.pdf`);
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
    doc.text('PRESCRIÇÃO MÉDICA', pageWidth / 2, 16, { align: 'center' });

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
