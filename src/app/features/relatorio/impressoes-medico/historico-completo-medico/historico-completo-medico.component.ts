import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { tokenService } from 'src/app/util/Token/Token.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';
import { Usuario } from 'src/app/util/variados/interfaces/usuario/usuario';
import { Consultav2 } from 'src/app/util/variados/interfaces/consulta/consultav2';
import { HistoricoCompletoResponse } from 'src/app/util/variados/interfaces/historico/historico-completo-response.interface';

@Component({
  selector: 'app-historico-completo-medico',
  templateUrl:'./historico-completo-medico.component.html',
  styleUrls: ['./historico-completo-medico.component.css'],
})
export class HistoricoCompletoMedicoComponent implements OnInit {
  historico: HistoricoCompletoResponse[] = [];
  pacienteInfo: any = null;
  UsuarioLogado: Usuario = {
    id: 0,
    aud: '',
    exp: '',
    iss: '',
    sub: '', 
  };

  constructor(
    public dialogRef: MatDialogRef<HistoricoCompletoMedicoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Consultav2,
    private consultaApiService: ConsultaApiService,
    private tokenService: tokenService
  ) { }


  ngOnInit() {
    console.log('Dados recebidos:', this.data);
    this.tokenService.decodificaToken();
    this.tokenService.UsuarioLogadoValue$.subscribe((dados) => {
      if (dados) {
        this.UsuarioLogado = dados;
      }
    });

    const profissionalId = this.UsuarioLogado.aud === '[ROLE_Medico]' ? this.UsuarioLogado.id : undefined;
console.log('paci,tipo,profi',this.data.pacienteId,'medico',profissionalId)
    this.consultaApiService.BuscandoHistoricoDeConsultasDoPaciente(
      this.data.pacienteId, 'medico', profissionalId
    ).subscribe((data: HistoricoCompletoResponse[]) => {
      console.log('Histórico recebido:', data);

      // Backend retorna array direto com todos os dados incluindo prontuários
      this.historico = data || [];

      // Extrair informações do paciente do primeiro registro
      if (this.historico.length > 0) {
        const primeiro = this.historico[0];
        this.pacienteInfo = {
          nome: primeiro.pacienteNome,
          cpf: primeiro.pacienteCpf,
          dataNascimento: primeiro.pacienteDataNascimento,
          telefone: primeiro.pacienteTelefone,
          id: primeiro.pacienteId
        };
      }
    });
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
    if (this.pacienteInfo) {
      y = this.pdfSecao(doc, 'DADOS DO PACIENTE', m, y, w);
      y = this.pdfTabela(doc, [[
        { b: 'Nome:', t: this.pacienteInfo.nome },
        { b: 'CPF:', t: this.pacienteInfo.cpf },
        { b: 'Nasc.:', t: this.formatarData(this.pacienteInfo.dataNascimento) },
        { b: 'Tel.:', t: this.pacienteInfo.telefone },
      ]], m, y, w);
    }

    y = this.pdfSecao(doc, `CONSULTAS MÉDICAS (${this.historico.length || 0} registros)`, m, y, w);

    if (this.historico && this.historico.length > 0) {
      for (let i = 0; i < this.historico.length; i++) {
        const it = this.historico[i];

        y = this.pdfQuebraPagina(doc, y, 30, pw, ph, m);

        // ── Barra da consulta ──
        doc.setFillColor(55, 65, 81);
        doc.rect(m, y, w, 5, 'F');
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`Consulta ${i + 1} — ${this.formatarData(it.dataHora)}`, m + 2, y + 3.5);
        y += 5;

        // ── Info da consulta (tabela) ──
        y = this.pdfTabela(doc, [
          [
            { b: 'Nº:', t: it.consultaId?.toString() || '-' },
            { b: 'Pront.:', t: it.codigoProntuario?.toString() || '-' },
            { b: 'Data:', t: this.formatarData(it.dataHora) },
            { b: 'Hora:', t: this.formatarHora(it.dataHora) },
            { b: 'Status:', t: it.status || '-' },
          ],
          [
            { b: 'Médico:', t: `Dr(a). ${it.profissionalNome || '-'}`, span: 2 },
            { b: 'CRM:', t: `${it.profissionalCrm || '-'} | ${it.profissionalEspecialidade || '-'}` },
            { b: 'Valor:', t: it.valor ? `R$ ${it.valor.toFixed(2)}` : '-' },
            { b: 'Duração:', t: it.duracaoMinutos ? `${it.duracaoMinutos} min` : (it.tempoDuracao || '-') },
          ],
        ], m, y, w);

        // ── Sinais vitais (tabela) ──
        const sv: any[] = [];
        if (it.peso) sv.push({ b: 'Peso:', t: `${it.peso} kg` });
        if (it.altura) sv.push({ b: 'Altura:', t: `${it.altura} cm` });
        if (it.temperatura) sv.push({ b: 'Temp.:', t: `${it.temperatura} °C` });
        if (it.pressao) sv.push({ b: 'PA:', t: it.pressao });
        if (it.saturacao) sv.push({ b: 'SpO2:', t: `${it.saturacao}%` });
        if (it.hemoglobina) sv.push({ b: 'Hb:', t: it.hemoglobina });
        if (it.frequenciaRespiratoria) sv.push({ b: 'Fr. Resp.:', t: it.frequenciaRespiratoria });
        if (it.frequenciaArterialSistolica) sv.push({ b: 'PA Sist.:', t: it.frequenciaArterialSistolica });
        if (it.frequenciaArterialDiastolica) sv.push({ b: 'PA Diast.:', t: it.frequenciaArterialDiastolica });
        if (sv.length > 0) y = this.pdfTabela(doc, [sv], m, y, w);

        // ── Queixa / Diagnóstico (tabela) ──
        const qd: any[] = [];
        if (it.queixaPrincipal) qd.push({ b: 'Queixa:', t: it.queixaPrincipal });
        if (it.diagnostico) qd.push({ b: 'Diagnóstico:', t: it.diagnostico });
        if (qd.length > 0) y = this.pdfTabela(doc, [qd], m, y, w);

        // ── Campos inline (linhas individuais) ──
        if (it.anamnese) { y = this.pdfQuebraPagina(doc, y, 6, pw, ph, m); y = this.pdfLinhaInline(doc, 'Anamnese:', it.anamnese, m, y, w); }

        // ── Exame Físico ──
        if (it.exame) { y = this.pdfQuebraPagina(doc, y, 6, pw, ph, m); y = this.pdfLinhaInline(doc, 'Exame Físico:', it.exame, m, y, w); }

        // ── Conduta ──
        if (it.conduta) { y = this.pdfQuebraPagina(doc, y, 6, pw, ph, m); y = this.pdfLinhaInline(doc, 'Conduta:', it.conduta, m, y, w); }

        // ── Prescrição ──
        if (it.prescricao) {
          const lbl = `Prescrição${it.tituloPrescricao ? ' — ' + it.tituloPrescricao : ''}${it.dataPrescricao ? ' (' + it.dataPrescricao + ')' : ''}:`;
          y = this.pdfQuebraPagina(doc, y, 6, pw, ph, m);
          y = this.pdfLinhaInline(doc, lbl, it.prescricao, m, y, w);
        }

        // ── Observações ──
        if (it.observacao) { y = this.pdfQuebraPagina(doc, y, 6, pw, ph, m); y = this.pdfLinhaInline(doc, 'Observações:', it.observacao, m, y, w); }

        // ── Data Finalização ──
        if (it.dataFinalizado) { y = this.pdfQuebraPagina(doc, y, 6, pw, ph, m); y = this.pdfLinhaInline(doc, 'Data Finalização:', it.dataFinalizado, m, y, w); }

        // ── Planejamentos ──
        if (it.planejamentos && Array.isArray(it.planejamentos) && it.planejamentos.length > 0) {
          console.log('Gerando planejamentos no PDF:', it.planejamentos); // Debug
          y = this.pdfQuebraPagina(doc, y, 10, pw, ph, m);
          y = this.pdfSecao(doc, 'PLANEJAMENTOS TERAPÊUTICOS', m, y, w);
          const rows = it.planejamentos.map((p: any) => [
            { b: 'Data:', t: p.dataProcedimento || '-' },
            { b: 'Proced.:', t: p.procedimentoRealizado || p.procedimento || '-' },
            { b: 'Valor:', t: p.valor ? `R$ ${p.valor.toFixed(2)}` : '-' },
            { b: 'Assin.:', t: p.statusAssinatura || '-' },
          ]);
          y = this.pdfTabela(doc, rows, m, y, w);
        }

        // ── Separador entre consultas ──
        if (i < this.historico.length - 1) {
          y += 2;
          doc.setDrawColor(150, 150, 150);
          doc.setLineWidth(0.8);
          doc.line(m, y, m + w, y);
          doc.setLineWidth(0.3);
          doc.line(m, y + 1.5, m + w, y + 1.5);
          y += 5;
        }
      }
    } else {
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(156, 163, 175);
      doc.text('Nenhum registro de consulta médica encontrado.', m, y);
    }

    this.pdfRodape(doc, pw, ph);

    const nome = this.pacienteInfo
      ? `Historico_Medico_${this.pacienteInfo.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      : `Historico_Medico_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nome);
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
    doc.text('HISTÓRICO MÉDICO COMPLETO', pw / 2, y + 1, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    doc.text('Relatório Executivo de Consultas Médicas', pw / 2, y + 5, { align: 'center' });
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
        const fullText = `${cell.b} ${cell.t || '-'}`;
        const lines = doc.splitTextToSize(fullText, cw - 2);
        const h = Math.max(4, lines.length * 2.8 + 1);
        maxH = Math.max(maxH, h);
        processados.push({ x, cw, lines });
        x += cw;
      }

      // bordas
      x = m;
      for (const p of processados) {
        doc.rect(p.x, y, p.cw, maxH);
        x += p.cw;
      }

      // textos
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      for (const p of processados) {
        let ty = y + 2.8;
        for (const line of p.lines) {
          const parts = this.splitBoldNormal(line, p.lines.indexOf(line) === 0 ? (row.find((c: any) => true)?.b || '') : '');
          doc.setFont('helvetica', 'bold');
          doc.text(parts.bold, p.x + 1, ty);
          const boldWidth = doc.getTextWidth(parts.bold);
          doc.setFont('helvetica', 'normal');
          doc.text(parts.normal, p.x + 1 + boldWidth, ty);
          ty += 2.8;
        }
      }

      y += maxH;
    }
    return y;
  }

  private splitBoldNormal(fullLine: string, boldLabel: string): { bold: string; normal: string } {
    if (boldLabel && fullLine.startsWith(boldLabel)) {
      return { bold: boldLabel + ' ', normal: fullLine.substring(boldLabel.length).trim() };
    }
    return { bold: '', normal: fullLine };
  }

  private pdfLinhaInline(doc: any, label: string, texto: string, m: number, y: number, w: number): number {
    doc.setLineWidth(0.15);
    doc.setDrawColor(180, 180, 180);
    doc.setFontSize(8);

    const fullText = `${label} ${texto || '-'}`;
    const lines = doc.splitTextToSize(fullText, w - 2);
    const h = Math.max(4.5, lines.length * 3.2 + 1);

    doc.rect(m, y, w, h);

    let ty = y + 2.8;
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
        `Página ${i} de ${total} | Gerado em ${new Date().toLocaleString('pt-BR')}`,
        pw / 2, ph - 7, { align: 'center' }
      );
    }
  }

  private formatarData(data: string): string {
    if (!data) return '-';
    try { return new Date(data).toLocaleDateString('pt-BR'); } catch { return data; }
  }

  private formatarHora(dataHora: string): string {
    if (!dataHora) return '-';
    try { return new Date(dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch { return '-'; }
  }
}
