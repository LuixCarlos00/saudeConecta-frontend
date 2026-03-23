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
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const m = 10;
    const w = pw - m * 2;
    let y = 12;

    // ── Cabeçalho compacto ──
    this.pdfCabecalho(doc, pw, m, y);
    y += 12;

    // ── Dados do Paciente ──
    y = this.pdfSecao(doc, 'DADOS DO PACIENTE', m, y, w);
    y = this.pdfTabela(doc, [
      [
        { b: 'Nome:', t: this.nomePaciente },
        { b: 'CPF:', t: this.cpfPaciente },
        { b: 'Nasc.:', t: this.dataNascimento },
      ],
      [
        { b: 'Email:', t: this.emailPaciente },
        { b: 'Telefone:', t: this.telefonePaciente },
        { b: '', t: '' },
      ],
    ], m, y, w);

    // ── Dados da Consulta ──
    y = this.pdfSecao(doc, 'DADOS DA CONSULTA', m, y, w);
    y = this.pdfTabela(doc, [[
      { b: 'Data:', t: this.dataConsulta },
      { b: 'Horário:', t: this.horarioConsulta },
      { b: 'Dia:', t: this.diaSemana },
      { b: 'Status:', t: this.statusConsulta },
    ]], m, y, w);

    // ── Dentista ──
    y = this.pdfSecao(doc, 'DENTISTA ATENDENTE', m, y, w);
    y = this.pdfTabela(doc, [[
      { b: 'Nome:', t: `Dr. ${this.nomeDentista}` },
      { b: 'CRO:', t: this.cro },
      { b: 'Email:', t: this.emailDentista },
      { b: 'Tel.:', t: this.telefoneDentista },
    ]], m, y, w);

    // ── Sinais Vitais ──
    if (this.pressaoArterial || this.pulso || this.peso || this.altura || this.temperatura || this.edema) {
      y = this.pdfQuebraPagina(doc, y, 10, pw, ph, m);
      y = this.pdfSecao(doc, 'SINAIS VITAIS', m, y, w);
      const sv: any[] = [];
      if (this.pressaoArterial) sv.push({ b: 'PA:', t: this.pressaoArterial });
      if (this.pulso) sv.push({ b: 'Pulso:', t: this.pulso });
      if (this.peso) sv.push({ b: 'Peso:', t: this.peso });
      if (this.altura) sv.push({ b: 'Altura:', t: this.altura });
      if (this.temperatura) sv.push({ b: 'Temp.:', t: this.temperatura });
      if (this.edema) sv.push({ b: 'Edema:', t: this.edema });
      y = this.pdfTabela(doc, [sv], m, y, w);
    }

    // ── Queixa / Anamnese / Observações (inline) ──
    if (this.queixaPrincipal) { y = this.pdfQuebraPagina(doc, y, 6, pw, ph, m); y = this.pdfLinhaInline(doc, 'Queixa Principal:', this.queixaPrincipal, m, y, w); }
    if (this.anamnese) { y = this.pdfQuebraPagina(doc, y, 6, pw, ph, m); y = this.pdfLinhaInline(doc, 'Anamnese:', this.anamnese, m, y, w); }
    if (this.observacao) { y = this.pdfQuebraPagina(doc, y, 6, pw, ph, m); y = this.pdfLinhaInline(doc, 'Observações:', this.observacao, m, y, w); }

    // ── Exame Clínico (inline) ──
    if (this.higieneBucal || this.condicaoGengival || this.oclusal || this.atm) {
      y = this.pdfQuebraPagina(doc, y, 8, pw, ph, m);
      y = this.pdfSecao(doc, 'EXAME CLÍNICO', m, y, w);
      if (this.higieneBucal) y = this.pdfLinhaInline(doc, 'Higiene Bucal:', this.higieneBucal, m, y, w);
      if (this.condicaoGengival) y = this.pdfLinhaInline(doc, 'Cond. Gengival:', this.condicaoGengival, m, y, w);
      if (this.oclusal) y = this.pdfLinhaInline(doc, 'Oclusal:', this.oclusal, m, y, w);
      if (this.atm) y = this.pdfLinhaInline(doc, 'ATM:', this.atm, m, y, w);
    }

    // ── Exame Intrabucal (inline — linhas) ──
    const temIntra = this.facies || this.linfonodos || this.labios || this.mucosas ||
      this.soalhoBucal || this.palato || this.orofaringe || this.lingua || this.gengiva ||
      this.habitosNocivos || this.portadorAparelho || this.exameOutros;
    if (temIntra) {
      y = this.pdfQuebraPagina(doc, y, 8, pw, ph, m);
      y = this.pdfSecao(doc, 'EXAME INTRABUCAL', m, y, w);
      if (this.facies) { y = this.pdfQuebraPagina(doc, y, 5, pw, ph, m); y = this.pdfLinhaInline(doc, 'Fácies:', this.facies, m, y, w); }
      if (this.linfonodos) { y = this.pdfQuebraPagina(doc, y, 5, pw, ph, m); y = this.pdfLinhaInline(doc, 'Linfonodos:', this.linfonodos, m, y, w); }
      if (this.labios) { y = this.pdfQuebraPagina(doc, y, 5, pw, ph, m); y = this.pdfLinhaInline(doc, 'Lábios:', this.labios, m, y, w); }
      if (this.mucosas) { y = this.pdfQuebraPagina(doc, y, 5, pw, ph, m); y = this.pdfLinhaInline(doc, 'Mucosas:', this.mucosas, m, y, w); }
      if (this.soalhoBucal) { y = this.pdfQuebraPagina(doc, y, 5, pw, ph, m); y = this.pdfLinhaInline(doc, 'Soalho Bucal:', this.soalhoBucal, m, y, w); }
      if (this.palato) { y = this.pdfQuebraPagina(doc, y, 5, pw, ph, m); y = this.pdfLinhaInline(doc, 'Palato:', this.palato, m, y, w); }
      if (this.orofaringe) { y = this.pdfQuebraPagina(doc, y, 5, pw, ph, m); y = this.pdfLinhaInline(doc, 'Orofaringe:', this.orofaringe, m, y, w); }
      if (this.lingua) { y = this.pdfQuebraPagina(doc, y, 5, pw, ph, m); y = this.pdfLinhaInline(doc, 'Língua:', this.lingua, m, y, w); }
      if (this.gengiva) { y = this.pdfQuebraPagina(doc, y, 5, pw, ph, m); y = this.pdfLinhaInline(doc, 'Gengiva:', this.gengiva, m, y, w); }
      if (this.habitosNocivos) { y = this.pdfQuebraPagina(doc, y, 5, pw, ph, m); y = this.pdfLinhaInline(doc, 'Háb. Nocivos:', this.habitosNocivos, m, y, w); }
      if (this.portadorAparelho) { y = this.pdfQuebraPagina(doc, y, 5, pw, ph, m); y = this.pdfLinhaInline(doc, 'Ap. Ortodôntico:', this.portadorAparelho, m, y, w); }
      if (this.exameOutros) { y = this.pdfQuebraPagina(doc, y, 5, pw, ph, m); y = this.pdfLinhaInline(doc, 'Outros:', this.exameOutros, m, y, w); }
    }

    // ── Odontograma ──
    if (this.dentes.length > 0) {
      y = this.pdfQuebraPagina(doc, y, 10, pw, ph, m);
      y = this.pdfSecao(doc, 'ODONTOGRAMA (DENTES ALTERADOS)', m, y, w);
      const dentesRows = this.dentes.map((d: any) => [
        { b: '', t: String(d.numeroFdi || '') },
        { b: '', t: d.status || '' },
        { b: '', t: d.observacao || '-' },
      ]);
      y = this.pdfTabela(doc, [
        [{ b: 'DENTE (FDI)', t: '' }, { b: 'STATUS', t: '' }, { b: 'OBSERVAÇÃO', t: '' }],
        ...dentesRows,
      ], m, y, w);
    }

    // ── Diagnóstico / Tratamento / Prescrição / Orientações (inline) ──
    if (this.diagnostico) { y = this.pdfQuebraPagina(doc, y, 6, pw, ph, m); y = this.pdfLinhaInline(doc, 'Diagnóstico:', this.diagnostico, m, y, w); }
    if (this.planoTratamento) { y = this.pdfQuebraPagina(doc, y, 6, pw, ph, m); y = this.pdfLinhaInline(doc, 'Plano de Tratamento:', this.planoTratamento, m, y, w); }
    if (this.procedimentos) { y = this.pdfQuebraPagina(doc, y, 6, pw, ph, m); y = this.pdfLinhaInline(doc, 'Procedimentos:', this.procedimentos, m, y, w); }
    if (this.prescricao) { y = this.pdfQuebraPagina(doc, y, 6, pw, ph, m); y = this.pdfLinhaInline(doc, 'Prescrição:', this.prescricao, m, y, w); }
    if (this.orientacoes) { y = this.pdfQuebraPagina(doc, y, 6, pw, ph, m); y = this.pdfLinhaInline(doc, 'Orientações:', this.orientacoes, m, y, w); }

    // ── Códigos CID / TUSS ──
    if (this.cidTexto || this.tussTexto || this.solicitacaoExameTexto) {
      y = this.pdfQuebraPagina(doc, y, 8, pw, ph, m);
      y = this.pdfSecao(doc, 'CÓDIGOS CID / TUSS', m, y, w);
      if (this.cidTexto) y = this.pdfLinhaInline(doc, 'CID:', this.cidTexto, m, y, w);
      if (this.tussTexto) y = this.pdfLinhaInline(doc, 'TUSS:', this.tussTexto, m, y, w);
      if (this.solicitacaoExameTexto) y = this.pdfLinhaInline(doc, 'Solic. Exame:', this.solicitacaoExameTexto, m, y, w);
    }

    // ── Planejamento Terapêutico ──
    if (this.planejamentos.length > 0) {
      y = this.pdfQuebraPagina(doc, y, 10, pw, ph, m);
      y = this.pdfSecao(doc, 'PLANEJAMENTO TERAPÊUTICO', m, y, w);
      const planRows = this.planejamentos.map((p: any) => [
        { b: '', t: p.dataProcedimento || '-' },
        { b: '', t: p.procedimentoRealizado || '-' },
        { b: '', t: p.valor != null ? `R$ ${Number(p.valor).toFixed(2)}` : '-' },
      ]);
      y = this.pdfTabela(doc, [
        [{ b: 'DATA', t: '' }, { b: 'PROCEDIMENTO', t: '' }, { b: 'VALOR', t: '' }],
        ...planRows,
      ], m, y, w);

      // Total
      let total = 0;
      this.planejamentos.forEach((p: any) => total += Number(p.valor || 0));
      y = this.pdfLinhaInline(doc, 'TOTAL:', `R$ ${total.toFixed(2)}`, m, y, w);
    }

    // ── Tempo de Consulta ──
    if (this.tempoDuracao) { y = this.pdfQuebraPagina(doc, y, 6, pw, ph, m); y = this.pdfLinhaInline(doc, 'Tempo de Consulta:', this.tempoDuracao, m, y, w); }

    // ── Rodapé ──
    this.pdfRodape(doc, pw, ph);

    doc.save(`Registro_${this.codigoProntuario}_${this.dataAtual}.pdf`);
  }

  // ── Helpers PDF (compacto, bordas unificadas) ──────────────────────────────

  private pdfQuebraPagina(doc: any, y: number, necessario: number, pw: number, ph: number, m: number): number {
    if (y + necessario > ph - 12) {
      doc.addPage();
      y = 8;
    }
    return y;
  }

  private pdfCabecalho(doc: any, pw: number, m: number, y: number): void {
    const w = pw - m * 2;
    doc.setFillColor(44, 62, 80);
    doc.rect(m, y - 4, w, 10, 'F');
    doc.setFontSize(11.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('REGISTRO DE CONSULTA ODONTOLÓGICA', pw / 2, y + 1, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    doc.text(`Nº: ${this.codigoProntuario}`, pw / 2, y + 5, { align: 'center' });
  }

  private pdfSecao(doc: any, titulo: string, m: number, y: number, w: number): number {
    doc.setFillColor(107, 114, 128);
    doc.rect(m, y, 2, 5, 'F');
    doc.setFillColor(248, 249, 250);
    doc.rect(m + 2, y, w - 2, 5, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128);
    doc.text(titulo.toUpperCase(), m + 5, y + 3.5);
    return y + 6;
  }

  private pdfTabela(doc: any, rows: any[][], m: number, y: number, w: number): number {
    doc.setLineWidth(0.15);
    doc.setDrawColor(180, 180, 180);

    for (const row of rows) {
      const totalSpan = row.reduce((s: number, c: any) => s + (c.span || 1), 0);
      const colW = w / totalSpan;
      let x = m;
      let maxH = 4;

      const processados: Array<{ x: number; cw: number; lines: string[] }> = [];
      for (const cell of row) {
        const cw = colW * (cell.span || 1);
        const fullText = cell.t ? `${cell.b} ${cell.t}`.trim() : cell.b;
        const lines = doc.splitTextToSize(fullText, cw - 2);
        const h = Math.max(4.5, lines.length * 3.2 + 1);
        maxH = Math.max(maxH, h);
        processados.push({ x, cw, lines });
        x += cw;
      }

      for (const p of processados) {
        doc.rect(p.x, y, p.cw, maxH);
      }

      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      for (let ci = 0; ci < processados.length; ci++) {
        const p = processados[ci];
        const cell = row[ci];
        let ty = y + 2.8;
        for (let li = 0; li < p.lines.length; li++) {
          if (li === 0 && cell.b && cell.t) {
            doc.setFont('helvetica', 'bold');
            doc.text(cell.b + ' ', p.x + 1, ty);
            const bw = doc.getTextWidth(cell.b + ' ');
            doc.setFont('helvetica', 'normal');
            const rest = p.lines[0].substring(cell.b.length).trim();
            doc.text(rest, p.x + 1 + bw, ty);
          } else if (li === 0 && cell.b && !cell.t) {
            doc.setFont('helvetica', 'bold');
            doc.text(p.lines[0], p.x + 1, ty);
          } else {
            doc.setFont('helvetica', 'normal');
            doc.text(p.lines[li], p.x + 1, ty);
          }
          ty += 3.2;
        }
      }

      y += maxH;
    }
    return y;
  }

  private pdfLinhaInline(doc: any, label: string, texto: string, m: number, y: number, w: number): number {
    doc.setLineWidth(0.15);
    doc.setDrawColor(180, 180, 180);
    doc.setFontSize(8);

    const fullText = `${label} ${texto || '-'}`;
    const lines = doc.splitTextToSize(fullText, w - 2);
    const h = Math.max(4.5, lines.length * 3.2 + 1);

    doc.rect(m, y, w, h);

    let ty = y + 3.2;
    for (let i = 0; i < lines.length; i++) {
      if (i === 0) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81);
        doc.text(label, m + 1, ty);
        const lw = doc.getTextWidth(label + ' ');
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 30, 30);
        const restText = lines[0].substring(label.length).trim();
        doc.text(restText, m + 1 + lw, ty);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 30, 30);
        doc.text(lines[i], m + 1, ty);
      }
      ty += 3.2;
    }

    return y + h;
  }

  private pdfRodape(doc: any, pw: number, ph: number): void {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setDrawColor(107, 114, 128);
      doc.setLineWidth(0.3);
      doc.line(10, ph - 10, pw - 10, ph - 10);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Página ${i} de ${total} | Emitido em ${this.getDataAtual()} às ${this.getHoraAtual()} | Confidencial`,
        pw / 2, ph - 7, { align: 'center' }
      );
    }
  }

  fechar() {
    this.dialogRef.close();
  }
}
