import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';
import { tokenService } from 'src/app/util/Token/Token.service';
import { Prontuario } from 'src/app/util/variados/interfaces/Prontuario/Prontuario';
import { Usuario } from 'src/app/util/variados/interfaces/usuario/usuario';

@Component({
  selector: 'app-imprimir-registro',
  templateUrl: './ImprimirRegistro.component.html',
  styleUrls: ['./ImprimirRegistro.component.css'],
})
export class ImprimirRegistroComponent implements OnInit {
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
  emailPaciente: string = '';
  telefonePaciente: string = '';
  
  // Dados da consulta
  dataConsulta: string = '';
  horarioConsulta: string = '';
  diaSemana: string = '';
  statusConsulta: string = '';
  
  // Dados clínicos
  peso: string = '';
  altura: string = '';
  temperatura: string = '';
  saturacao: string = '';
  pressao: string = '';
  anamnese: string = '';
  diagnostico: string = '';
  prescricao: string = '';
  exame: string = '';
  conduta: string = '';
  observacao: string = '';
  
  UsuarioLogado: Usuario = {
    id: 0,
    aud: '',
    exp: '',
    iss: '',
    sub: '',
  };

  constructor(
    public dialogRef: MatDialogRef<ImprimirRegistroComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Prontuario,
    private tokenService: tokenService
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
    this.emailPaciente = this.data.consulta?.paciente?.email?.trim() || '';
    this.telefonePaciente = this.data.consulta?.paciente?.telefone?.trim() || '';

    // Dados da consulta
    const dataHora = this.data.consulta?.dataHora || '';
    if (dataHora) {
      const data = new Date(dataHora);
      this.dataConsulta = data.toLocaleDateString('pt-BR');
      this.horarioConsulta = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      this.diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'long' });
    }
    this.statusConsulta = this.data.consulta?.status || '';

    // Dados clínicos
    this.peso = this.data.peso || '';
    this.altura = this.data.altura || '';
    this.temperatura = this.data.temperatura || '';
    this.saturacao = this.data.saturacao || '';
    this.pressao = this.data.pressao || '';
    this.anamnese = this.data.anamnese || '';
    this.diagnostico = this.data.diagnostico || '';
    this.prescricao = this.data.prescricao || '';
    this.exame = this.data.exame || '';
    this.conduta = this.data.conduta || '';
    this.observacao = this.data.observacao || '';

    this.tokenService.decodificaToken();
    this.tokenService.UsuarioLogadoValue$.subscribe((dados) => {
      if (dados) {
        this.UsuarioLogado = dados;
      }
    });
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
    doc.text('REGISTRO DE CONSULTA', pageWidth / 2, 16, { align: 'center' });

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
      {label: 'Data Nascimento', value: this.dataNascimento},
      {label: 'Email', value: this.emailPaciente},
      {label: 'Telefone', value: this.telefonePaciente}
    ], y, margin, pageWidth);
    y += 3; // Reduzido de 5 para 3

    // Seção: Dados da Consulta
    y = this.adicionarSecaoVertical(doc, 'DADOS DA CONSULTA', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      {label: 'Data', value: this.dataConsulta},
      {label: 'Horário', value: this.horarioConsulta},
      {label: 'Dia da Semana', value: this.diaSemana},
      {label: 'Status', value: this.statusConsulta}
    ], y, margin, pageWidth);
    y += 3; // Reduzido de 5 para 3

    // Seção: Médico Atendente
    y = this.adicionarSecaoVertical(doc, 'MÉDICO ATENDENTE', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      {label: 'Nome', value: 'Dr. ' + this.nomeMedico},
      {label: 'CRM', value: this.crm},
      {label: 'Email', value: this.emailMedico},
      {label: 'Telefone', value: this.telefoneMedico}
    ], y, margin, pageWidth);
    y += 3; // Reduzido de 5 para 3

    // Seção: Dados Clínicos
    y = this.adicionarSecaoVertical(doc, 'DADOS CLÍNICOS', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      {label: 'Peso', value: this.peso || '-'},
      {label: 'Altura', value: this.altura || '-'},
      {label: 'Temperatura', value: this.temperatura || '-'},
      {label: 'Saturação', value: this.saturacao || '-'},
      {label: 'Pressão', value: this.pressao || '-'}
    ], y, margin, pageWidth);
    y += 3; // Reduzido de 5 para 3

    // Seção: Anamnese
    if (this.anamnese) {
      const alturaCaixa = 40;
      const espacoNecessario = 7.5 + alturaCaixa + 2; // seção + caixa + espaçamento
      
      // Verificar se cabe na página atual
      const resultado = this.verificarEspacoAdicionarPagina(doc, y, espacoNecessario, pageHeight, margin, pageWidth);
      y = resultado.y;
      paginaAtual += resultado.pagina;
      
      y = this.adicionarSecaoVertical(doc, 'ANAMNESE', null, y, margin, pageWidth);
      
      // Desenhar caixa de texto
      doc.setLineWidth(0.1);
      doc.setDrawColor(150, 150, 150);
      doc.rect(margin, y, pageWidth - (margin * 2), alturaCaixa, 'D');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      const linhas = doc.splitTextToSize(this.anamnese, pageWidth - (margin * 2) - 4);
      
      // Verificar se o texto cabe na caixa, senão aumentar a caixa
      const alturaTexto = linhas.length * 4;
      const alturaReal = Math.max(alturaCaixa, alturaTexto + 10);
      
      if (alturaReal > alturaCaixa) {
        // Se precisar de mais espaço, verificar novamente
        const espacoAdicional = alturaReal - alturaCaixa;
        const resultado = this.verificarEspacoAdicionarPagina(doc, y - 7.5, espacoNecessario + espacoAdicional, pageHeight, margin, pageWidth);
        y = resultado.y;
        paginaAtual += resultado.pagina;
        y = this.adicionarSecaoVertical(doc, 'ANAMNESE', null, y, margin, pageWidth);
        doc.rect(margin, y, pageWidth - (margin * 2), alturaReal, 'D');
      }
      
      doc.text(linhas, margin + 2, y + 8);
      y += alturaReal + 2;
    }

    // Seção: Diagnóstico
    if (this.diagnostico) {
      const alturaCaixa = 40;
      const espacoNecessario = 7.5 + alturaCaixa + 2;
      
      const resultado = this.verificarEspacoAdicionarPagina(doc, y, espacoNecessario, pageHeight, margin, pageWidth);
      y = resultado.y;
      paginaAtual += resultado.pagina;
      
      y = this.adicionarSecaoVertical(doc, 'DIAGNÓSTICO', null, y, margin, pageWidth);
      
      doc.setLineWidth(0.1);
      doc.setDrawColor(150, 150, 150);
      doc.rect(margin, y, pageWidth - (margin * 2), alturaCaixa, 'D');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      const linhas = doc.splitTextToSize(this.diagnostico, pageWidth - (margin * 2) - 4);
      
      const alturaTexto = linhas.length * 4;
      const alturaReal = Math.max(alturaCaixa, alturaTexto + 10);
      
      if (alturaReal > alturaCaixa) {
        const espacoAdicional = alturaReal - alturaCaixa;
        const resultado = this.verificarEspacoAdicionarPagina(doc, y - 7.5, espacoNecessario + espacoAdicional, pageHeight, margin, pageWidth);
        y = resultado.y;
        paginaAtual += resultado.pagina;
        y = this.adicionarSecaoVertical(doc, 'DIAGNÓSTICO', null, y, margin, pageWidth);
        doc.rect(margin, y, pageWidth - (margin * 2), alturaReal, 'D');
      }
      
      doc.text(linhas, margin + 2, y + 8);
      y += alturaReal + 2;
    }

    // Seção: Prescrição
    if (this.prescricao) {
      const alturaCaixa = 40;
      const espacoNecessario = 7.5 + alturaCaixa + 2;
      
      const resultado = this.verificarEspacoAdicionarPagina(doc, y, espacoNecessario, pageHeight, margin, pageWidth);
      y = resultado.y;
      paginaAtual += resultado.pagina;
      
      y = this.adicionarSecaoVertical(doc, 'PRESCRIÇÃO', null, y, margin, pageWidth);
      
      doc.setLineWidth(0.1);
      doc.setDrawColor(150, 150, 150);
      doc.rect(margin, y, pageWidth - (margin * 2), alturaCaixa, 'D');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      const linhas = doc.splitTextToSize(this.prescricao, pageWidth - (margin * 2) - 4);
      
      const alturaTexto = linhas.length * 4;
      const alturaReal = Math.max(alturaCaixa, alturaTexto + 10);
      
      if (alturaReal > alturaCaixa) {
        const espacoAdicional = alturaReal - alturaCaixa;
        const resultado2 = this.verificarEspacoAdicionarPagina(doc, y - 7.5, espacoNecessario + espacoAdicional, pageHeight, margin, pageWidth);
        y = resultado2.y;
        paginaAtual += resultado2.pagina;
        y = this.adicionarSecaoVertical(doc, 'PRESCRIÇÃO', null, y, margin, pageWidth);
        doc.rect(margin, y, pageWidth - (margin * 2), alturaReal, 'D');
      }
      
      doc.text(linhas, margin + 2, y + 8);
      y += alturaReal + 2;
    }

    // Seção: Exames
    if (this.exame) {
      const alturaCaixa = 40;
      const espacoNecessario = 7.5 + alturaCaixa + 2;
      
      const resultado = this.verificarEspacoAdicionarPagina(doc, y, espacoNecessario, pageHeight, margin, pageWidth);
      y = resultado.y;
      paginaAtual += resultado.pagina;
      
      y = this.adicionarSecaoVertical(doc, 'EXAMES SOLICITADOS', null, y, margin, pageWidth);
      
      doc.setLineWidth(0.1);
      doc.setDrawColor(150, 150, 150);
      doc.rect(margin, y, pageWidth - (margin * 2), alturaCaixa, 'D');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      const linhas = doc.splitTextToSize(this.exame, pageWidth - (margin * 2) - 4);
      
      const alturaTexto = linhas.length * 4;
      const alturaReal = Math.max(alturaCaixa, alturaTexto + 10);
      
      if (alturaReal > alturaCaixa) {
        const espacoAdicional = alturaReal - alturaCaixa;
        const resultado2 = this.verificarEspacoAdicionarPagina(doc, y - 7.5, espacoNecessario + espacoAdicional, pageHeight, margin, pageWidth);
        y = resultado2.y;
        paginaAtual += resultado2.pagina;
        y = this.adicionarSecaoVertical(doc, 'EXAMES SOLICITADOS', null, y, margin, pageWidth);
        doc.rect(margin, y, pageWidth - (margin * 2), alturaReal, 'D');
      }
      
      doc.text(linhas, margin + 2, y + 8);
      y += alturaReal + 2;
    }

    // Seção: Conduta
    if (this.conduta) {
      const alturaCaixa = 30;
      const espacoNecessario = 7.5 + alturaCaixa + 2;
      
      const resultado = this.verificarEspacoAdicionarPagina(doc, y, espacoNecessario, pageHeight, margin, pageWidth);
      y = resultado.y;
      paginaAtual += resultado.pagina;
      
      y = this.adicionarSecaoVertical(doc, 'CONDUTA', null, y, margin, pageWidth);
      
      doc.setLineWidth(0.1);
      doc.setDrawColor(150, 150, 150);
      doc.rect(margin, y, pageWidth - (margin * 2), alturaCaixa, 'D');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      const linhas = doc.splitTextToSize(this.conduta, pageWidth - (margin * 2) - 4);
      
      const alturaTexto = linhas.length * 4;
      const alturaReal = Math.max(alturaCaixa, alturaTexto + 10);
      
      if (alturaReal > alturaCaixa) {
        const espacoAdicional = alturaReal - alturaCaixa;
        const resultado2 = this.verificarEspacoAdicionarPagina(doc, y - 7.5, espacoNecessario + espacoAdicional, pageHeight, margin, pageWidth);
        y = resultado2.y;
        paginaAtual += resultado2.pagina;
        y = this.adicionarSecaoVertical(doc, 'CONDUTA', null, y, margin, pageWidth);
        doc.rect(margin, y, pageWidth - (margin * 2), alturaReal, 'D');
      }
      
      doc.text(linhas, margin + 2, y + 8);
      y += alturaReal + 2;
    }

    // Seção: Observações
    if (this.observacao) {
      const alturaCaixa = 30;
      const espacoNecessario = 7.5 + alturaCaixa + 2;
      
      const resultado = this.verificarEspacoAdicionarPagina(doc, y, espacoNecessario, pageHeight, margin, pageWidth);
      y = resultado.y;
      paginaAtual += resultado.pagina;
      
      y = this.adicionarSecaoVertical(doc, 'OBSERVAÇÕES', null, y, margin, pageWidth);
      
      doc.setLineWidth(0.1);
      doc.setDrawColor(150, 150, 150);
      doc.rect(margin, y, pageWidth - (margin * 2), alturaCaixa, 'D');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      const linhas = doc.splitTextToSize(this.observacao, pageWidth - (margin * 2) - 4);
      
      const alturaTexto = linhas.length * 4;
      const alturaReal = Math.max(alturaCaixa, alturaTexto + 10);
      
      if (alturaReal > alturaCaixa) {
        const espacoAdicional = alturaReal - alturaCaixa;
        const resultado2 = this.verificarEspacoAdicionarPagina(doc, y - 7.5, espacoNecessario + espacoAdicional, pageHeight, margin, pageWidth);
        y = resultado2.y;
        paginaAtual += resultado2.pagina;
        y = this.adicionarSecaoVertical(doc, 'OBSERVAÇÕES', null, y, margin, pageWidth);
        doc.rect(margin, y, pageWidth - (margin * 2), alturaReal, 'D');
      }
      
      doc.text(linhas, margin + 2, y + 8);
      y += alturaReal + 2;
    }

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
    doc.text('Documento de registro clínico - Confidencial', pageWidth - margin, footerY + 5, { align: 'right' });

    // Salvar
    doc.save(`Registro_${this.data.codigoProntuario}_${this.dataAtual}.pdf`);
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
    doc.text('REGISTRO DE CONSULTA', pageWidth / 2, 16, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Nº: ${this.data.codigoProntuario || '000000'} - Continuação`, pageWidth / 2, 20, { align: 'center' });

    doc.setTextColor(0, 0, 0);
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

  private adicionarCampoVertical(doc: jsPDF, label: string, valor: string, y: number, margin: number): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(102, 102, 102);
    doc.text(label.toUpperCase(), margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(valor || '-', margin + 35, y);

    return y + 3;
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

  // Método para adicionar campos em linha (horizontal)
adicionarCamposHorizontal(doc: jsPDF, campos: Array<{label: string, value: string}>, y: number, margin: number, pageWidth: number): number {
  const colunas = campos.length;
  const larguraColuna = (pageWidth - (margin * 2)) / colunas;
  const alturaCampo = 8; // Aumentado para acomodar linha
  
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

// Métodos para formatar data e hora dinamicamente
getDataAtual(): string {
  return new Date().toLocaleDateString('pt-BR');
}

getHoraAtual(): string {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

fechar() {
    this.dialogRef.close();
  }
}
