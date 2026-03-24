import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { ProntuarioApiService } from 'src/app/services/api/prontuario-api.service';
import { jsPDF } from 'jspdf';
import { ProntuarioDentistaApiService } from 'src/app/services/api/prontuario-dentista-api.service';

@Component({
  selector: 'app-questionario-saude-medico',
  templateUrl: './questionario-saude-medico.component.html',
  styleUrls: ['./questionario-saude-medico.component.css'],
})
export class QuestionarioSaudeMedicoComponent implements OnInit, OnDestroy {

  // Dados do profissional
  nomeMedico = '';
  crm = '';

  // Dados do paciente
  nomePaciente = '';
  cpfPaciente = '';

  // Dados da consulta
  consultaId = '';
  dataConsulta = '';
  horarioConsulta = '';
  codigoProntuario = '';

  // Questionário
  questionarioRespondido = false;
  questionarioStatus = '';
  questionarioPerguntas: { pergunta: string; resposta: string; observacao?: string }[] = [];
  questionarioAssinatura = '';
  questionarioDataAssinatura = '';
  questionarioIpOrigem = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<QuestionarioSaudeMedicoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private prontuarioApi: ProntuarioApiService,
    private  prontuarioDentistaApi: ProntuarioDentistaApiService
  ) {}

  ngOnInit(): void {
    const p = this.data;

    // ── Profissional ──
    const prof = p.profissional as any;
    this.nomeMedico = prof?.nome?.trim() || '';
    this.crm = prof?.registroConselho?.trim() || prof?.conselho?.trim() || '';

    // ── Paciente ──
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

    // ── Consulta ──
    this.consultaId = consulta?.id?.toString() || '';
    if (consulta?.dataHora) {
      const dt = new Date(consulta.dataHora);
      this.dataConsulta = dt.toLocaleDateString('pt-BR');
      this.horarioConsulta = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    // ── Prontuário ──
    this.codigoProntuario = p.codigo?.toString() || p.codigoProntuario?.toString() || '';

    // ── Carregar Questionário ──
    const consultaId = consulta?.id || p.consultaId;
    if (consultaId) {
      this.carregarQuestionario(consultaId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private carregarQuestionario(consultaId: number): void {
this.prontuarioDentistaApi.buscarQuestionarioSaude(consultaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.questionarioRespondido = resp?.respondido || false;
          this.questionarioStatus = resp?.status || '';
          this.questionarioAssinatura = resp?.assinaturaBase64 || '';
          this.questionarioDataAssinatura = resp?.dataAssinatura || '';
          this.questionarioIpOrigem = resp?.ipOrigem || '';

          if (resp?.respostasQuestionario) {
            try {
              const parsed = JSON.parse(resp.respostasQuestionario);
              this.questionarioPerguntas = this.mapearPerguntas(parsed);
            } catch {
              this.questionarioPerguntas = [];
            }
          }
        },
        error: () => {
          this.questionarioRespondido = false;
        }
      });
  }

  private mapearPerguntas(data: any): { pergunta: string; resposta: string; observacao?: string }[] {
    if (Array.isArray(data)) return data;
    return Object.entries(data).map(([key, value]) => {
      if (typeof value === 'object' && value !== null && 'pergunta' in value && 'resposta' in value) {
        const v = value as { pergunta?: string; resposta?: string; observacao?: string };
        return { pergunta: v.pergunta || key, resposta: v.resposta || '', observacao: v.observacao || '' };
      }
      return { pergunta: key, resposta: typeof value === 'string' ? value : '', observacao: '' };
    });
  }

  formatarDataAssinatura(): string {
    if (!this.questionarioDataAssinatura) return '-';
    try {
      const dt = new Date(this.questionarioDataAssinatura);
      return dt.toLocaleDateString('pt-BR') + ' às ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return this.questionarioDataAssinatura;
    }
  }

  fechar(): void {
    this.dialogRef.close();
  }

  getDataAtual(): string {
    return new Date().toLocaleDateString('pt-BR');
  }

  getHoraAtual(): string {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  GerarPDF(): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = 20;

    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('QUESTIONÁRIO DE SAÚDE', pageWidth / 2, 16, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Nº: ${this.codigoProntuario}`, pageWidth / 2, 20, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y = 35;

    y = this.adicionarSecao(doc, 'DADOS DO PROFISSIONAL', y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Nome', value: this.nomeMedico },
      { label: 'CRM', value: this.crm },
    ], y, margin, pageWidth);
    y += 3;

    y = this.adicionarSecao(doc, 'DADOS DO PACIENTE', y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Paciente', value: this.nomePaciente },
      { label: 'CPF', value: this.cpfPaciente || '-' },
    ], y, margin, pageWidth);
    y += 3;

    y = this.adicionarSecao(doc, 'DADOS DA CONSULTA', y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Consulta Nº', value: this.consultaId },
      { label: 'Data', value: this.dataConsulta },
      { label: 'Horário', value: this.horarioConsulta },
    ], y, margin, pageWidth);
    y += 3;

    if (this.questionarioPerguntas.length > 0) {
      y = this.adicionarSecao(doc, 'RESPOSTAS DO QUESTIONÁRIO', y, margin, pageWidth);

      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, pageWidth - (margin * 2), 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.text('PERGUNTA', margin + 2, y + 4.5);
      doc.text('RESPOSTA', margin + 110, y + 4.5);
      doc.text('OBSERVAÇÃO', margin + 135, y + 4.5);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      for (const item of this.questionarioPerguntas) {
        if (y > pageHeight - 30) { doc.addPage(); y = 12; }
        doc.setDrawColor(230, 230, 230);
        doc.rect(margin, y, pageWidth - (margin * 2), 6);
        const pergunta = doc.splitTextToSize(item.pergunta || '-', 105);
        doc.text(pergunta, margin + 2, y + 4);
        doc.text(item.resposta || '-', margin + 110, y + 4);
        doc.text(item.observacao || '—', margin + 135, y + 4);
        y += Math.max(6, pergunta.length * 4);
      }
      y += 5;
    }

    if (this.questionarioRespondido) {
      y = this.adicionarSecao(doc, 'ASSINATURA DIGITAL', y, margin, pageWidth);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(`Data/Hora: ${this.formatarDataAssinatura()}`, margin + 4, y + 5);
      doc.text(`IP de Origem: ${this.questionarioIpOrigem || '-'}`, margin + 4, y + 10);
      y += 14;

      if (this.questionarioAssinatura) {
        try {
          const imgData = this.questionarioAssinatura.startsWith('data:')
            ? this.questionarioAssinatura
            : `data:image/png;base64,${this.questionarioAssinatura}`;
          doc.addImage(imgData, 'PNG', margin + 30, y, 60, 30);
          y += 35;
        } catch {
          doc.text('Assinatura digital registrada', margin + 4, y + 5);
          y += 10;
        }
      }
    }

    const footerY = pageHeight - 15;
    doc.setLineWidth(0.3);
    doc.setDrawColor(100, 100, 100);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(136, 136, 136);
    doc.text(`Emitido em: ${this.getDataAtual()} às ${this.getHoraAtual()}`, margin, footerY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(153, 153, 153);
    doc.text('Documento clínico - Confidencial', pageWidth - margin, footerY + 5, { align: 'right' });

    doc.save(`Questionario_Saude_${this.codigoProntuario}_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  private adicionarSecao(doc: jsPDF, titulo: string, y: number, margin: number, pageWidth: number): number {
    if (y > 250) { doc.addPage(); y = 12; }
    doc.setFillColor(248, 249, 250);
    doc.rect(margin, y, pageWidth - (margin * 2), 6, 'F');
    doc.setFillColor(100, 100, 100);
    doc.rect(margin, y, 2, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(titulo.toUpperCase(), margin + 4, y + 4);
    return y + 7.5;
  }

  private adicionarCamposHorizontal(doc: jsPDF, campos: Array<{ label: string; value: string }>, y: number, margin: number, pageWidth: number): number {
    const colunas = campos.length;
    const largura = (pageWidth - (margin * 2)) / colunas;
    doc.setLineWidth(0.1);
    doc.setDrawColor(180, 180, 180);
    campos.forEach((_, i) => doc.rect(margin + (i * largura), y, largura, 10));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(102, 102, 102);
    campos.forEach((c, i) => doc.text(c.label.toUpperCase(), margin + (i * largura) + 2, y + 3));
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    campos.forEach((c, i) => doc.text(c.value || '-', margin + (i * largura) + 2, y + 7));
    return y + 10;
  }
}