import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-registro-consulta-dentista',
  templateUrl: './registro-consulta-dentista.component.html',
  styleUrls: ['./registro-consulta-dentista.component.css'],
})
export class RegistroConsultaDentistaComponent implements OnInit {

  dataAtual = new Date().toISOString().split('T')[0];

  // Dados do profissional
  nomeDentista = '';
  cro = '';
  emailDentista = '';
  telefoneDentista = '';

  // Dados do paciente
  nomePaciente = '';
  cpfPaciente = '';
  dataNascimento = '';
  emailPaciente = '';
  telefonePaciente = '';

  // Dados da consulta
  dataConsulta = '';
  horarioConsulta = '';
  diaSemana = '';
  statusConsulta = '';

  // Sinais Vitais
  pressaoArterial = '';
  pulso = '';
  altura = '';
  temperatura = '';
  peso = '';
  edema = '';

  // Exame clínico odontológico
  higieneBucal = '';
  condicaoGengival = '';
  oclusal = '';
  atm = '';

  // Anamnese
  queixaPrincipal = '';
  anamnese = '';
  observacao = '';

  // Exame Intrabucal
  facies = '';
  linfonodos = '';
  labios = '';
  mucosas = '';
  soalhoBucal = '';
  palato = '';
  orofaringe = '';
  lingua = '';
  gengiva = '';
  habitosNocivos = '';
  portadorAparelho = '';
  oclusao = '';
  exameOutros = '';

  // Odontograma
  dentes: any[] = [];

  // Diagnóstico e Tratamento
  diagnostico = '';
  planoTratamento = '';
  procedimentos = '';
  prescricao = '';
  orientacoes = '';

  // Códigos TUSS e CID
  tussTexto = '';
  cidTexto = '';
  solicitacaoExameTexto = '';

  // Planejamento Terapêutico
  planejamentos: any[] = [];

  // ID para o PDF
  codigoProntuario = '';
  tempoDuracao = '';

  constructor(
    public dialogRef: MatDialogRef<RegistroConsultaDentistaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    const p = this.data;
    console.log('Dados recebidos para impressão (registro dentista):', p);

    // ── Profissional ─────────────────────────────────────────────────────────
    const prof = p.profissional as any;
    this.nomeDentista = prof?.nome?.trim() || '';
    this.cro = prof?.registroConselho?.trim() || prof?.conselho?.trim() || '';
    this.emailDentista = prof?.email?.trim() || '';
    this.telefoneDentista = prof?.telefone?.trim() || '';

    // ── Paciente ─────────────────────────────────────────────────────────────
    const consulta = p.consulta as any;
    const paciente = consulta?.paciente;
    this.nomePaciente = paciente?.paciNome?.trim()
      ?? paciente?.nome?.trim()
      ?? consulta?.pacienteNome?.trim()
      ?? '';
    this.cpfPaciente = paciente?.paciCpf?.trim()
      ?? paciente?.cpf?.trim()
      ?? consulta?.pacienteCpf?.trim()
      ?? '';
    this.dataNascimento = paciente?.paciDataNacimento
      ?? paciente?.dataNascimento
      ?? '';
    this.emailPaciente = paciente?.paciEmail?.trim()
      ?? paciente?.email?.trim()
      ?? '';
    this.telefonePaciente = paciente?.paciTelefone?.trim()
      ?? paciente?.telefone?.trim()
      ?? '';

    // ── Dados da consulta ─────────────────────────────────────────────────────
    const dataHora = consulta?.dataHora || '';
    if (dataHora) {
      const dt = new Date(dataHora);
      this.dataConsulta = dt.toLocaleDateString('pt-BR');
      this.horarioConsulta = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      this.diaSemana = dt.toLocaleDateString('pt-BR', { weekday: 'long' });
    }
    this.statusConsulta = consulta?.status || '';

    // ── Sinais Vitais ──────────────────────────────────────────────────────────
    this.pressaoArterial = p.pressaoArterial || '';
    this.pulso = p.pulso || '';
    this.altura = p.altura || '';
    this.temperatura = p.temperatura || '';
    this.peso = p.peso || '';
    this.edema = p.edema || '';

    // ── Exame clínico odontológico ────────────────────────────────────────────
    this.higieneBucal = p.higieneBucal || '';
    this.condicaoGengival = p.condicaoGengival || '';
    this.oclusal = p.oclusal || '';
    this.atm = p.atm || '';

    // ── Anamnese ──────────────────────────────────────────────────────────────
    this.queixaPrincipal = p.queixaPrincipal || '';
    this.anamnese = p.anamnese || '';
    this.observacao = p.observacao || '';

    // ── Exame Intrabucal ──────────────────────────────────────────────────────
    this.facies = p.facies || '';
    this.linfonodos = p.linfonodos || '';
    this.labios = p.labios || '';
    this.mucosas = p.mucosas || '';
    this.soalhoBucal = p.soalhoBucal || '';
    this.palato = p.palato || '';
    this.orofaringe = p.orofaringe || '';
    this.lingua = p.lingua || '';
    this.gengiva = p.gengiva || '';
    this.habitosNocivos = p.habitosNocivos || '';
    this.portadorAparelho = p.portadorAparelho || '';
    this.oclusao = p.oclusao || '';
    this.exameOutros = p.exameOutros || '';

    // ── Odontograma ──────────────────────────────────────────────────────────
    this.dentes = p.dentes || [];

    // ── Diagnóstico e Tratamento ─────────────────────────────────────────────
    this.diagnostico = p.diagnostico || '';
    this.planoTratamento = p.planoTratamento || '';
    this.procedimentos = p.procedimentos || '';
    this.prescricao = p.prescricao || '';
    this.orientacoes = p.orientacoes || '';

    // ── Códigos TUSS e CID ──────────────────────────────────────────────────
    this.tussTexto = p.tussTexto?.trim() || '';
    this.cidTexto = p.cidTexto?.trim() || '';
    this.solicitacaoExameTexto = p.solicitacaoExameTexto?.trim() || '';

    // ── Planejamento Terapêutico ─────────────────────────────────────────────
    this.planejamentos = p.planejamentos || [];

    // ── Identificação ─────────────────────────────────────────────────────────
    this.codigoProntuario = String(p.codigo ?? p.codigoProntuario ?? '000000');
    this.tempoDuracao = p.tempoDuracao || '';
  }

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

    // Cabeçalho
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('REGISTRO DE CONSULTA ODONTOLÓGICA', pageWidth / 2, 16, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Nº: ${this.codigoProntuario}`, pageWidth / 2, 20, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y = 35;

    // Seção: Dados do Paciente
    y = this.adicionarSecaoVertical(doc, 'DADOS DO PACIENTE', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Nome', value: this.nomePaciente },
      { label: 'CPF', value: this.cpfPaciente },
      { label: 'Data Nasc.', value: this.dataNascimento },
      { label: 'Email', value: this.emailPaciente },
      { label: 'Telefone', value: this.telefonePaciente },
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Dados da Consulta
    y = this.adicionarSecaoVertical(doc, 'DADOS DA CONSULTA', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Data', value: this.dataConsulta },
      { label: 'Horário', value: this.horarioConsulta },
      { label: 'Dia da Semana', value: this.diaSemana },
      { label: 'Status', value: this.statusConsulta },
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Dentista Atendente
    y = this.adicionarSecaoVertical(doc, 'DENTISTA ATENDENTE', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Nome', value: `Dr. ${this.nomeDentista}` },
      { label: 'CRO', value: this.cro },
      { label: 'Email', value: this.emailDentista },
      { label: 'Telefone', value: this.telefoneDentista },
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Sinais Vitais
    if (this.pressaoArterial || this.pulso || this.peso || this.altura || this.temperatura || this.edema) {
      const resSinais = this.verificarEspacoAdicionarPagina(doc, y, 20, pageHeight, margin, pageWidth);
      y = resSinais.y; paginaAtual += resSinais.pagina;
      y = this.adicionarSecaoVertical(doc, 'SINAIS VITAIS', null, y, margin, pageWidth);
      y = this.adicionarCamposHorizontalDinamico(doc, [
        { label: 'Pressão Arterial', value: this.pressaoArterial || '-' },
        { label: 'Pulso', value: this.pulso || '-' },
        { label: 'Peso', value: this.peso || '-' },
        { label: 'Altura', value: this.altura || '-' },
        { label: 'Temperatura', value: this.temperatura || '-' },
        { label: 'Edema', value: this.edema || '-' },
      ], y, margin, pageWidth);
      y += 3;
    }

    // Seção: Anamnese
    const secoesAnamnese: Array<{ titulo: string; valor: string }> = [
      { titulo: 'QUEIXA PRINCIPAL', valor: this.queixaPrincipal },
      { titulo: 'ANAMNESE', valor: this.anamnese },
      { titulo: 'OBSERVAÇÕES', valor: this.observacao },
    ];
    y = this.renderizarSecoesTextuais(doc, secoesAnamnese, y, margin, pageWidth, pageHeight, paginaAtual);

    // Seção: Exame Clínico
    const resExame = this.verificarEspacoAdicionarPagina(doc, y, 20, pageHeight, margin, pageWidth);
    y = resExame.y; paginaAtual += resExame.pagina;
    y = this.adicionarSecaoVertical(doc, 'EXAME CLÍNICO', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontalDinamico(doc, [
      { label: 'Higiene Bucal', value: this.higieneBucal || '-' },
      { label: 'Cond. Gengival', value: this.condicaoGengival || '-' },
      { label: 'Oclusal', value: this.oclusal || '-' },
      { label: 'ATM', value: this.atm || '-' },
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Exame Intrabucal
    const temExameIntrabucal = this.facies || this.linfonodos || this.labios || this.mucosas ||
      this.soalhoBucal || this.palato || this.orofaringe || this.lingua || this.gengiva ||
      this.habitosNocivos || this.portadorAparelho || this.oclusao || this.exameOutros;
    if (temExameIntrabucal) {
      const resIntra = this.verificarEspacoAdicionarPagina(doc, y, 30, pageHeight, margin, pageWidth);
      y = resIntra.y; paginaAtual += resIntra.pagina;
      y = this.adicionarSecaoVertical(doc, 'EXAME INTRABUCAL', null, y, margin, pageWidth);
      y = this.adicionarCamposHorizontalDinamico(doc, [
        { label: 'Fácies', value: this.facies || '-' },
        { label: 'Linfonodos', value: this.linfonodos || '-' },
        { label: 'Lábios', value: this.labios || '-' },
        { label: 'Mucosas', value: this.mucosas || '-' },
      ], y, margin, pageWidth);
      y = this.adicionarCamposHorizontalDinamico(doc, [
        { label: 'Soalho Bucal', value: this.soalhoBucal || '-' },
        { label: 'Palato', value: this.palato || '-' },
        { label: 'Orofaringe', value: this.orofaringe || '-' },
        { label: 'Língua', value: this.lingua || '-' },
      ], y, margin, pageWidth);
      y = this.adicionarCamposHorizontalDinamico(doc, [
        { label: 'Gengiva', value: this.gengiva || '-' },
        { label: 'Háb. Nocivos', value: this.habitosNocivos || '-' },
        { label: 'Ap. Ortodôntico', value: this.portadorAparelho || '-' },
        { label: 'Oclusão', value: this.oclusao || '-' },
      ], y, margin, pageWidth);
      if (this.exameOutros) {
        y = this.adicionarCamposHorizontalDinamico(doc, [
          { label: 'Outros', value: this.exameOutros },
        ], y, margin, pageWidth);
      }
      y += 3;
    }

    // Seção: Odontograma
    if (this.dentes.length > 0) {
      const resOdonto = this.verificarEspacoAdicionarPagina(doc, y, 15 + (this.dentes.length * 5), pageHeight, margin, pageWidth);
      y = resOdonto.y; paginaAtual += resOdonto.pagina;
      y = this.adicionarSecaoVertical(doc, 'ODONTOGRAMA (DENTES ALTERADOS)', null, y, margin, pageWidth);

      const colWidths = [25, 50, (pageWidth - (margin * 2) - 75)];
      // Header da tabela
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 2, pageWidth - (margin * 2), 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.text('DENTE (FDI)', margin + 2, y + 2);
      doc.text('STATUS', margin + colWidths[0] + 2, y + 2);
      doc.text('OBSERVAÇÃO', margin + colWidths[0] + colWidths[1] + 2, y + 2);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      for (const dente of this.dentes) {
        const resDente = this.verificarEspacoAdicionarPagina(doc, y, 6, pageHeight, margin, pageWidth);
        y = resDente.y; paginaAtual += resDente.pagina;

        doc.setDrawColor(230, 230, 230);
        doc.line(margin, y + 3, pageWidth - margin, y + 3);
        doc.text(String(dente.numeroFdi || ''), margin + 2, y + 2);
        doc.text(dente.status || '', margin + colWidths[0] + 2, y + 2);
        doc.text(dente.observacao || '', margin + colWidths[0] + colWidths[1] + 2, y + 2);
        y += 5;
      }
      y += 3;
    }

    // Seção: Diagnóstico e Tratamento
    const secoesDiagnostico: Array<{ titulo: string; valor: string }> = [
      { titulo: 'DIAGNÓSTICO', valor: this.diagnostico },
      { titulo: 'PLANO DE TRATAMENTO', valor: this.planoTratamento },
      { titulo: 'PROCEDIMENTOS REALIZADOS', valor: this.procedimentos },
      { titulo: 'PRESCRIÇÃO ODONTOLÓGICA', valor: this.prescricao },
      { titulo: 'ORIENTAÇÕES', valor: this.orientacoes },
    ];
    y = this.renderizarSecoesTextuais(doc, secoesDiagnostico, y, margin, pageWidth, pageHeight, paginaAtual);

    // Seção: Códigos TUSS e CID
    if (this.cidTexto || this.tussTexto || this.solicitacaoExameTexto) {
      const resCodigos = this.verificarEspacoAdicionarPagina(doc, y, 25, pageHeight, margin, pageWidth);
      y = resCodigos.y; paginaAtual += resCodigos.pagina;
      y = this.adicionarSecaoVertical(doc, 'CÓDIGOS CID / TUSS', null, y, margin, pageWidth);

      const larguraLabel = 42;
      const larguraValor = pageWidth - (margin * 2) - larguraLabel;
      const itens = [
        { label: 'CID', valor: this.cidTexto },
        { label: 'TUSS', valor: this.tussTexto },
        { label: 'SOLIC. EXAME', valor: this.solicitacaoExameTexto },
      ];
      for (const item of itens) {
        if (!item.valor) continue;
        doc.setFontSize(8);
        const linhasValor = doc.splitTextToSize(item.valor, larguraValor - 4);
        const alturaCaixa = Math.max(8, linhasValor.length * 4 + 4);

        const resItem = this.verificarEspacoAdicionarPagina(doc, y, alturaCaixa, pageHeight, margin, pageWidth);
        y = resItem.y; paginaAtual += resItem.pagina;

        // Caixa do label
        doc.setLineWidth(0.1);
        doc.setDrawColor(180, 180, 180);
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y, larguraLabel, alturaCaixa, 'FD');
        // Caixa do valor
        doc.rect(margin + larguraLabel, y, larguraValor, alturaCaixa);

        // Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(80, 80, 80);
        doc.text(item.label, margin + 2, y + (alturaCaixa / 2) + 1);

        // Valor
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(linhasValor, margin + larguraLabel + 2, y + 4);

        y += alturaCaixa;
      }
      y += 3;
    }

    // Seção: Planejamento Terapêutico
    if (this.planejamentos.length > 0) {
      const resPlan = this.verificarEspacoAdicionarPagina(doc, y, 15 + (this.planejamentos.length * 5), pageHeight, margin, pageWidth);
      y = resPlan.y; paginaAtual += resPlan.pagina;
      y = this.adicionarSecaoVertical(doc, 'PLANEJAMENTO TERAPÊUTICO', null, y, margin, pageWidth);

      const colW = [35, (pageWidth - (margin * 2) - 65), 30];
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 2, pageWidth - (margin * 2), 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.text('DATA', margin + 2, y + 2);
      doc.text('PROCEDIMENTO', margin + colW[0] + 2, y + 2);
      doc.text('VALOR', margin + colW[0] + colW[1] + 2, y + 2);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      let totalPlan = 0;
      for (const plan of this.planejamentos) {
        const resPlanItem = this.verificarEspacoAdicionarPagina(doc, y, 6, pageHeight, margin, pageWidth);
        y = resPlanItem.y; paginaAtual += resPlanItem.pagina;

        doc.setDrawColor(230, 230, 230);
        doc.line(margin, y + 3, pageWidth - margin, y + 3);
        doc.text(plan.dataProcedimento || '', margin + 2, y + 2);
        doc.text(plan.procedimentoRealizado || '', margin + colW[0] + 2, y + 2);
        const valor = plan.valor != null ? Number(plan.valor).toFixed(2) : '0.00';
        doc.text(`R$ ${valor}`, margin + colW[0] + colW[1] + 2, y + 2);
        totalPlan += Number(plan.valor || 0);
        y += 5;
      }
      // Total
      const resTot = this.verificarEspacoAdicionarPagina(doc, y, 8, pageHeight, margin, pageWidth);
      y = resTot.y; paginaAtual += resTot.pagina;
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL:', margin + colW[0] + 2, y + 2);
      doc.text(`R$ ${totalPlan.toFixed(2)}`, margin + colW[0] + colW[1] + 2, y + 2);
      y += 8;
    }

    // Tempo de duração
    if (this.tempoDuracao) {
      const resTempo = this.verificarEspacoAdicionarPagina(doc, y, 15, pageHeight, margin, pageWidth);
      y = resTempo.y; paginaAtual += resTempo.pagina;
      y = this.adicionarSecaoVertical(doc, 'TEMPO DE CONSULTA', null, y, margin, pageWidth);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(this.tempoDuracao, margin + 2, y + 2);
      y += 10;
    }

    // Rodapé
    const footerY = pageHeight - 15;
    doc.setLineWidth(0.3);
    doc.setDrawColor(52, 152, 219);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(136, 136, 136);
    doc.text(`Emitido em: ${this.getDataAtual()} às ${this.getHoraAtual()}`, margin, footerY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(153, 153, 153);
    doc.text('Documento de registro clínico - Confidencial', pageWidth - margin, footerY + 5, { align: 'right' });

    doc.save(`Registro_${this.codigoProntuario}_${this.dataAtual}.pdf`);
  }

  /**
   * Renderiza seções textuais dinâmicas no PDF (caixa com título e texto).
   * Pula seções vazias automaticamente.
   */
  private renderizarSecoesTextuais(
    doc: jsPDF, secoes: Array<{ titulo: string; valor: string }>,
    y: number, margin: number, pageWidth: number,
    pageHeight: number, paginaAtual: number
  ): number {
    for (const secao of secoes) {
      if (!secao.valor) continue;
      const alturaBase = 25;
      const espacoNecessario = 7.5 + alturaBase + 2;
      const resultado = this.verificarEspacoAdicionarPagina(doc, y, espacoNecessario, pageHeight, margin, pageWidth);
      y = resultado.y;
      paginaAtual += resultado.pagina;

      y = this.adicionarSecaoVertical(doc, secao.titulo, null, y, margin, pageWidth);

      doc.setLineWidth(0.1);
      doc.setDrawColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      const linhas = doc.splitTextToSize(secao.valor, pageWidth - (margin * 2) - 4);
      const alturaTexto = linhas.length * 4;
      const alturaReal = Math.max(alturaBase, alturaTexto + 10);

      const resultado2 = this.verificarEspacoAdicionarPagina(doc, y, alturaReal + 2, pageHeight, margin, pageWidth);
      if (resultado2.pagina > 0) {
        y = resultado2.y;
        paginaAtual += resultado2.pagina;
        y = this.adicionarSecaoVertical(doc, secao.titulo, null, y, margin, pageWidth);
      }

      doc.rect(margin, y, pageWidth - (margin * 2), alturaReal, 'D');
      doc.text(linhas, margin + 2, y + 8);
      y += alturaReal + 2;
    }
    return y;
  }

  private adicionarSecaoVertical(
    doc: jsPDF, titulo: string, cor: string | null,
    y: number, margin: number, pageWidth: number
  ): number {
    doc.setFillColor(248, 249, 250);
    doc.rect(margin, y, pageWidth - (margin * 2), 6, 'F');
    if (cor) {
      const rgb = this.hexToRgb(cor);
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.rect(margin, y, 2, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
    } else {
      doc.setFillColor(100, 100, 100);
      doc.rect(margin, y, 2, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
    }
    doc.text(titulo.toUpperCase(), margin + 4, y + 4);
    doc.setTextColor(0, 0, 0);
    return y + 7.5;
  }

  private adicionarCamposHorizontal(
    doc: jsPDF, campos: Array<{ label: string; value: string }>,
    y: number, margin: number, pageWidth: number
  ): number {
    const colunas = campos.length;
    const larguraColuna = (pageWidth - (margin * 2)) / colunas;
    const alturaCampo = 10;

    // Bordas — rect para cada célula
    doc.setLineWidth(0.1);
    doc.setDrawColor(180, 180, 180);
    campos.forEach((_, index) => {
      const x = margin + (index * larguraColuna);
      doc.rect(x, y, larguraColuna, alturaCampo);
    });

    // Labels
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(102, 102, 102);
    campos.forEach((campo, index) => {
      const x = margin + (index * larguraColuna) + 2;
      doc.text(campo.label.toUpperCase(), x, y + 3);
    });

    // Values
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    campos.forEach((campo, index) => {
      const x = margin + (index * larguraColuna) + 2;
      const texto = doc.splitTextToSize(campo.value || '-', larguraColuna - 4);
      doc.text(texto, x, y + 7);
    });
    return y + alturaCampo;
  }

  /**
   * Versão dinâmica: calcula a altura de cada coluna pelo texto real
   * e usa a maior — evita overflow em textos longos.
   * Usa rect para cada célula, evitando linhas duplicadas ao empilhar.
   */
  private adicionarCamposHorizontalDinamico(
    doc: jsPDF, campos: Array<{ label: string; value: string }>,
    y: number, margin: number, pageWidth: number
  ): number {
    const colunas = campos.length;
    const larguraColuna = (pageWidth - (margin * 2)) / colunas;
    const alturaMinima = 10;
    const linhaAltura = 4;

    // 1. Calcular as linhas de cada coluna
    const linhasPorCampo = campos.map(campo => {
      doc.setFontSize(8);
      return doc.splitTextToSize(campo.value || '-', larguraColuna - 6);
    });

    // 2. Altura de cada coluna; a maior vira a altura uniforme
    const alturaCampo = Math.max(
      alturaMinima,
      ...linhasPorCampo.map(linhas => linhas.length * linhaAltura + 8)
    );

    // 3. Bordas — rect para cada célula (sem linhas duplicadas)
    doc.setLineWidth(0.1);
    doc.setDrawColor(180, 180, 180);
    campos.forEach((_, index) => {
      const x = margin + (index * larguraColuna);
      doc.rect(x, y, larguraColuna, alturaCampo);
    });

    // 4. Labels
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(102, 102, 102);
    campos.forEach((campo, index) => {
      const x = margin + (index * larguraColuna) + 2;
      doc.text(campo.label.toUpperCase(), x, y + 3);
    });

    // 5. Values com quebra de linha
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    campos.forEach((_, index) => {
      const x = margin + (index * larguraColuna) + 2;
      doc.text(linhasPorCampo[index], x, y + 7);
    });

    return y + alturaCampo;
  }

  private verificarEspacoAdicionarPagina(
    doc: jsPDF, y: number, espacoNecessario: number,
    pageHeight: number, margin: number, pageWidth: number
  ): { y: number; pagina: number } {
    if (y + espacoNecessario > pageHeight - margin - 20) {
      doc.addPage();
      this.adicionarCabecalhoPagina(doc, pageWidth);
      return { y: 35, pagina: 1 };
    }
    return { y, pagina: 0 };
  }

  private adicionarCabecalhoPagina(doc: jsPDF, pageWidth: number): void {
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('REGISTRO DE CONSULTA ODONTOLÓGICA', pageWidth / 2, 16, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Nº: ${this.codigoProntuario} - Continuação`, pageWidth / 2, 20, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }

  private hexToRgb(hex: string | null): { r: number; g: number; b: number } {
    if (!hex) { return { r: 0, g: 0, b: 0 }; }
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 0, g: 0, b: 0 };
  }

  fechar() {
    this.dialogRef.close();
  }
}
