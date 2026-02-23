import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { tokenService } from 'src/app/util/Token/Token.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';
import { Usuario } from 'src/app/util/variados/interfaces/usuario/usuario';
import { Consultav2 } from 'src/app/util/variados/interfaces/consulta/consultav2';
import { HistoricoCompletoDentistaResponse } from 'src/app/util/variados/interfaces/historico/historico-completo-dentista-response.interface';

@Component({
  selector: 'app-historico-completo-dentista',
  templateUrl: './historico-completo-dentista.component.html',
  styleUrls: ['./historico-completo-dentista.component.css'],
})
export class HistoricoCompletoDentistaComponent implements OnInit {
  historico: HistoricoCompletoDentistaResponse[] = [];
  pacienteInfo: any = null;

  UsuarioLogado: Usuario = {
    id: 0,
    aud: '',
    exp: '',
    iss: '',
    sub: '',
  };

  constructor(
    public dialogRef: MatDialogRef<HistoricoCompletoDentistaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Consultav2,
    private consultaApiService: ConsultaApiService,
    private tokenService: tokenService
  ) { }

  ngOnInit() {
    console.log('Histórico Dentista - dados recebidos:', this.data);

    this.tokenService.decodificaToken();
    this.tokenService.UsuarioLogadoValue$.subscribe((dados) => {
      if (dados) { this.UsuarioLogado = dados; }
    });

    this.consultaApiService
      .BuscandoHistoricoDeConsultasDoPaciente_dentista(this.data.pacienteId)
      .subscribe((data: HistoricoCompletoDentistaResponse[]) => {
        console.log('Histórico dental recebido:', data);
        this.historico = data || [];

        if (this.historico.length > 0) {
          const primeiro = this.historico[0];
          this.pacienteInfo = {
            nome: primeiro.pacienteNome,
            cpf: primeiro.pacienteCpf,
            dataNascimento: primeiro.pacienteDataNascimento,
            telefone: primeiro.pacienteTelefone,
            id: primeiro.pacienteId,
          };
        }

        if (this.UsuarioLogado.aud === '[ROLE_Dentista]') {
          this.historico = this.historico.filter(
            (item) => item.profissionalId === this.UsuarioLogado.id
          );
        }
      });
  }

  GerarPDF() {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = 20;

    this.adicionarCabecalhoExecutivo(doc, pageWidth, margin, y);
    y += 20;

    if (this.pacienteInfo) {
      y = this.adicionarSecaoHorizontal(doc, 'DADOS DO PACIENTE', margin, y, pageWidth);
      y = this.adicionarCamposHorizontal(doc, [
        { label: 'Nome:', value: this.pacienteInfo.nome, width: 60 },
        { label: 'CPF:', value: this.pacienteInfo.cpf, width: 35 },
        { label: 'Data Nasc.:', value: this.formatarData(this.pacienteInfo.dataNascimento), width: 30 },
        { label: 'Telefone:', value: this.pacienteInfo.telefone, width: 35 },
      ], margin, y, pageWidth);
      y += 8;
    }

    y = this.adicionarSecaoHorizontal(
      doc, `HISTÓRICO DE CONSULTAS ODONTOLÓGICAS (${this.historico?.length || 0} registros)`,
      margin, y, pageWidth
    );
    y += 5;

    if (this.historico && this.historico.length > 0) {
      for (let i = 0; i < this.historico.length; i++) {
        const item = this.historico[i];

        if (y > pageHeight - 120) {
          doc.addPage();
          y = 20;
          this.adicionarCabecalhoExecutivo(doc, pageWidth, margin, y);
          y += 20;
        }

        y = this.adicionarSubsecao(
          doc, `Consulta ${i + 1} — ${this.formatarData(item.dataHora)}`, margin, y, pageWidth
        );
        y += 3;

        y = this.adicionarCamposHorizontal(doc, [
          { label: 'Data:', value: this.formatarData(item.dataHora), width: 25 },
          { label: 'Horário:', value: this.formatarHora(item.dataHora), width: 20 },
          { label: 'Dentista:', value: `Dr(a). ${item.profissionalNome || '-'}`, width: 45 },
          { label: 'CRO / Especialidade:', value: `${item.profissionalCrm || '-'} | ${item.profissionalEspecialidade || '-'}`, width: 45 },
        ], margin, y, pageWidth);
        y += 5;

        // Queixa / Diagnóstico
        const clinica: any[] = [];
        if (item.queixaPrincipal) { clinica.push({ label: 'Queixa Principal:', value: item.queixaPrincipal }); }
        if (item.diagnostico) { clinica.push({ label: 'Diagnóstico:', value: item.diagnostico }); }
        if (clinica.length > 0) { y = this.adicionarCamposHorizontal(doc, clinica, margin, y, pageWidth); y += 5; }

        // Exame Clínico Bucal
        const exameBucal: any[] = [];
        if (item.higieneBucal) { exameBucal.push({ label: 'Higiene Bucal:', value: item.higieneBucal }); }
        if (item.condicaoGengival) { exameBucal.push({ label: 'Condição Gengival:', value: item.condicaoGengival }); }
        if (item.oclusal) { exameBucal.push({ label: 'Oclusal:', value: item.oclusal }); }
        if (item.atm) { exameBucal.push({ label: 'ATM:', value: item.atm }); }
        if (exameBucal.length > 0) { y = this.adicionarCamposHorizontal(doc, exameBucal, margin, y, pageWidth); y += 5; }

        // Anamnese
        if (item.anamnese) {
          y = this.adicionarCaixaExpansivel(doc, 'Anamnese:', item.anamnese, margin, y, pageWidth, pageHeight);
          y += 3;
        }

        // Plano de Tratamento / Procedimentos / Orientações
        const tratamento: any[] = [];
        if (item.planoTratamento) { tratamento.push({ label: 'Plano de Tratamento:', value: item.planoTratamento }); }
        if (item.procedimentos) { tratamento.push({ label: 'Procedimentos:', value: item.procedimentos }); }
        if (tratamento.length > 0) { y = this.adicionarCamposHorizontal(doc, tratamento, margin, y, pageWidth); y += 5; }
        if (item.orientacoes) {
          y = this.adicionarCaixaExpansivel(doc, 'Orientações:', item.orientacoes, margin, y, pageWidth, pageHeight);
          y += 3;
        }

        // Prescrição
        if (item.prescricao) {
          y = this.adicionarCaixaExpansivel(doc, `Prescrição (${item.tituloPrescricao || ''} ${item.dataPrescricao || ''}):`, item.prescricao, margin, y, pageWidth, pageHeight);
          y += 3;
        }

        // Exames
        if (item.tituloExame) {
          y = this.adicionarCamposHorizontal(doc, [
            { label: 'Exame:', value: item.tituloExame },
            { label: 'Data Exame:', value: item.dataExame || '-' },
          ], margin, y, pageWidth);
          y += 5;
        }

        // Observações
        if (item.observacao) {
          y = this.adicionarCaixaExpansivel(doc, 'Observações:', item.observacao, margin, y, pageWidth, pageHeight);
          y += 3;
        }

        // Odontograma
        if (item.dentes && item.dentes.length > 0) {
          if (y > pageHeight - 60) { doc.addPage(); y = 20; }
          y = this.adicionarSecaoHorizontal(doc, 'ODONTOGRAMA', margin, y, pageWidth);
          const dentesTexto = item.dentes
            .sort((a, b) => a.numeroFdi - b.numeroFdi)
            .map(d => `Dente ${d.numeroFdi}: ${d.status}${d.observacao ? ' — ' + d.observacao : ''}`)
            .join('  |  ');
          y = this.adicionarCaixaExpansivel(doc, 'Dentes:', dentesTexto, margin, y, pageWidth, pageHeight);
          y += 3;
        }

        y += 5;
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
      }
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(156, 163, 175);
      doc.text('Nenhum registro de consulta odontológica encontrado.', margin, y);
    }

    this.adicionarRodapeExecutivo(doc, pageWidth, pageHeight);

    const nome = this.pacienteInfo
      ? `Historico_Dental_${this.pacienteInfo.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      : `Historico_Dental_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nome);
  }

  getLabelStatus(status: string): string {
    const labels: Record<string, string> = {
      sadio: 'Sadio', cariado: 'Cariado', obturado: 'Obturado',
      ausente: 'Ausente', protese: 'Prótese', canal: 'Canal',
      fratura: 'Fratura', implante: 'Implante'
    };
    return labels[status] ?? status;
  }

  getClasseDente(status: string): string {
    const classes: Record<string, string> = {
      sadio: 'dente-sadio', cariado: 'dente-cariado', obturado: 'dente-obturado',
      ausente: 'dente-ausente', protese: 'dente-protese', canal: 'dente-canal',
      fratura: 'dente-fratura', implante: 'dente-implante'
    };
    return classes[status] ?? '';
  }

  // ── Helpers PDF (idênticos ao componente médico) ──────────────────────────

  private adicionarCabecalhoExecutivo(doc: any, pageWidth: number, margin: number, y: number) {
    doc.setFillColor(44, 62, 80);
    doc.rect(margin, y - 10, pageWidth - (margin * 2), 15, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('HISTÓRICO ODONTOLÓGICO COMPLETO', pageWidth / 2, y, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    doc.text('Relatório Executivo de Consultas Odontológicas', pageWidth / 2, y + 4, { align: 'center' });
  }

  private adicionarSecaoHorizontal(doc: any, titulo: string, margin: number, y: number, pageWidth: number): number {
    doc.setFillColor(107, 114, 128);
    doc.rect(margin, y, 3, 8, 'F');
    doc.setFillColor(248, 249, 250);
    doc.rect(margin + 3, y, pageWidth - (margin * 2) - 3, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128);
    doc.text(titulo.toUpperCase(), margin + 8, y + 5);
    return y + 12;
  }

  private adicionarSubsecao(doc: any, titulo: string, margin: number, y: number, pageWidth: number): number {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text(titulo, margin, y + 3);
    return y + 6;
  }

  private adicionarCamposHorizontal(doc: any, campos: any[], margin: number, y: number, pageWidth: number): number {
    const availableWidth = pageWidth - margin * 2;
    const colunas = campos.length;
    const larguraColuna = availableWidth / colunas;
    let lineY = y;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);

    let maxLines = 1;
    const textosProcessados: Array<{ lines: string[]; x: number; y: number }> = [];

    campos.forEach((campo, index) => {
      const x = margin + index * larguraColuna + 2;
      const valor = campo.value || '-';
      const texto = doc.splitTextToSize(valor, larguraColuna - 4);
      textosProcessados.push({ lines: texto, x, y: lineY + 4 });
      maxLines = Math.max(maxLines, texto.length);
    });

    const alturaDinamica = 4 + maxLines * 3;

    doc.setLineWidth(0.1);
    doc.setDrawColor(150, 150, 150);
    campos.forEach((_, index) => {
      const x = margin + index * larguraColuna;
      doc.line(x, lineY - 2, x + larguraColuna, lineY - 2);
      doc.line(x, lineY + alturaDinamica - 1, x + larguraColuna, lineY + alturaDinamica - 1);
      if (index < colunas - 1) {
        doc.line(x + larguraColuna, lineY - 2, x + larguraColuna, lineY + alturaDinamica - 1);
      }
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(102, 102, 102);
    campos.forEach((campo, index) => {
      const x = margin + index * larguraColuna + 2;
      doc.text(campo.label.toUpperCase(), x, lineY);
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    textosProcessados.forEach((t) => doc.text(t.lines, t.x, t.y));

    return lineY + alturaDinamica + 2;
  }

  private adicionarCaixaExpansivel(
    doc: any, label: string, texto: string,
    margin: number, y: number, pageWidth: number, pageHeight: number
  ): number {
    const availableWidth = pageWidth - margin * 2;
    if (y + 20 > pageHeight - 20) { doc.addPage(); y = 20; }
    const linhas = doc.splitTextToSize(texto || '-', availableWidth - 10);
    const alturaNecessaria = 10 + linhas.length * 4;
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, y - 2, availableWidth, alturaNecessaria, 'F');
    doc.setLineWidth(0.1);
    doc.setDrawColor(150, 150, 150);
    doc.line(margin, y - 2, margin + availableWidth, y - 2);
    doc.line(margin, y - 2, margin, y + alturaNecessaria - 2);
    doc.line(margin + availableWidth, y - 2, margin + availableWidth, y + alturaNecessaria - 2);
    doc.line(margin, y + alturaNecessaria - 2, margin + availableWidth, y + alturaNecessaria - 2);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128);
    doc.text(label, margin + 3, y + 2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(linhas, margin + 3, y + 8);
    return y + alturaNecessaria + 4;
  }

  private adicionarRodapeExecutivo(doc: any, pageWidth: number, pageHeight: number) {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(107, 114, 128);
      doc.setLineWidth(0.5);
      doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Página ${i} de ${totalPages} | Gerado em ${new Date().toLocaleString('pt-BR')}`,
        pageWidth / 2, pageHeight - 10, { align: 'center' }
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
