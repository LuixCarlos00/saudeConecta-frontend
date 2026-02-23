import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { tokenService } from 'src/app/util/Token/Token.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';
import { Usuario } from 'src/app/util/variados/interfaces/usuario/usuario';
import { Consultav2 } from 'src/app/util/variados/interfaces/consulta/consultav2';
import { HistoricoCompletoResponse } from 'src/app/util/variados/interfaces/historico/historico-completo-response.interface';

@Component({
  selector: 'app-historicoCompleto',
  templateUrl: './historicoCompleto.component.html',
  styleUrls: ['./historicoCompleto.component.css'],
})
export class HistoricoCompletoComponent implements OnInit {
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
    public dialogRef: MatDialogRef<HistoricoCompletoComponent>,
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

    this.consultaApiService.BuscandoHistoricoDeConsultasDoPaciente(
      this.data.pacienteId
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

      // Filtrar por médico se necessário
      if (this.UsuarioLogado.aud === '[ROLE_Medico]') {
        this.historico = this.historico.filter((item) => {
          return item.profissionalId === this.UsuarioLogado.id;
        });
      }
    });
  }


  GerarPDF() {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = 20;

    // Cabeçalho executivo moderno
    this.adicionarCabecalhoExecutivo(doc, pageWidth, margin, y);
    y += 20;

    // Seção: Dados do Paciente
    if (this.pacienteInfo) {
      y = this.adicionarSecaoHorizontal(doc, 'DADOS DO PACIENTE', margin, y, pageWidth);

      // Layout horizontal com campos em linha
      const camposPaciente = [
        { label: 'Nome:', value: this.pacienteInfo.nome, width: 60 },
        { label: 'CPF:', value: this.pacienteInfo.cpf, width: 35 },
        { label: 'Data Nasc.:', value: this.formatarData(this.pacienteInfo.dataNascimento), width: 30 },
        { label: 'Telefone:', value: this.pacienteInfo.telefone, width: 35 }
      ];

      y = this.adicionarCamposHorizontal(doc, camposPaciente, margin, y, pageWidth);
      y += 8;
    }

    // Seção: Histórico de Consultas
    y = this.adicionarSecaoHorizontal(doc, `HISTÓRICO DE CONSULTAS (${this.historico?.length || 0} registros)`, margin, y, pageWidth);
    y += 5;

    // Loop pelo histórico com layout moderno
    if (this.historico && this.historico.length > 0) {
      for (let i = 0; i < this.historico.length; i++) {
        const item = this.historico[i];

        // Verifica se precisa de nova página antes da consulta
        if (y > pageHeight - 100) {
          doc.addPage();
          y = 20;
          // Repetir cabeçalho em nova página
          this.adicionarCabecalhoExecutivo(doc, pageWidth, margin, y);
          y += 20;
        }

        // Subseção para cada consulta
        y = this.adicionarSubsecao(doc, `Consulta ${i + 1} - ${this.formatarData(item.dataHora)}`, margin, y, pageWidth);
        y += 3;

        // Layout horizontal: Data/Hora e Profissional
        const camposConsulta = [
          { label: 'Data:', value: this.formatarData(item.dataHora), width: 25 },
          { label: 'Horário:', value: this.formatarHora(item.dataHora), width: 20 },
          { label: 'Profissional:', value: `Dr(a). ${item.profissionalNome}`, width: 45 },
          { label: 'CRM/Esp:', value: `${item.profissionalCrm} | ${item.profissionalEspecialidade}`, width: 45 }
        ];

        y = this.adicionarCamposHorizontal(doc, camposConsulta, margin, y, pageWidth);
        y += 5;

        // Layout horizontal: Dados Vitais
        const dadosVitais = [];
        if (item.peso) dadosVitais.push({ label: 'Peso:', value: `${item.peso}kg`, width: 20 });
        if (item.altura) dadosVitais.push({ label: 'Altura:', value: `${item.altura}m`, width: 20 });
        if (item.temperatura) dadosVitais.push({ label: 'Temp:', value: `${item.temperatura}°C`, width: 20 });
        if (item.pressao) dadosVitais.push({ label: 'PA:', value: item.pressao, width: 20 });
        if (item.saturacao) dadosVitais.push({ label: 'SpO2:', value: `${item.saturacao}%`, width: 20 });

        if (dadosVitais.length > 0) {
          y = this.adicionarCamposHorizontal(doc, dadosVitais, margin, y, pageWidth);
          y += 5;
        }

        // Layout horizontal: Informações Clínicas
        const infoClinicas = [];
        if (item.queixaPrincipal) infoClinicas.push({ label: 'Queixa:', value: item.queixaPrincipal, width: 50 });
        if (item.diagnostico) infoClinicas.push({ label: 'Diagnóstico:', value: item.diagnostico, width: 50 });

        if (infoClinicas.length > 0) {
          y = this.adicionarCamposHorizontal(doc, infoClinicas, margin, y, pageWidth);
          y += 5;
        }

        // Layout horizontal: Prescrição e Exames
        const tratamentos = [];
        if (item.prescricao) tratamentos.push({ label: 'Prescrição:', value: item.prescricao, width: 50 });
        if (item.exame) tratamentos.push({ label: 'Exames:', value: item.exame, width: 50 });

        if (tratamentos.length > 0) {
          y = this.adicionarCamposHorizontal(doc, tratamentos, margin, y, pageWidth);
          y += 5;
        }

        // Caixa de texto expansível para observações
        if (item.observacao) {
          y = this.adicionarCaixaExpansivel(doc, 'Observações:', item.observacao, margin, y, pageWidth, pageHeight);
        }

        // Informações adicionais em linha
        const adicionais = [];
        if (item.tempoDuracao) adicionais.push({ label: 'Duração:', value: item.tempoDuracao, width: 25 });

        if (adicionais.length > 0) {
          y = this.adicionarCamposHorizontal(doc, adicionais, margin, y, pageWidth);
          y += 8;
        } else {
          y += 8;
        }

        // Linha separadora entre consultas
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
      }
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(156, 163, 175);
      doc.text('Nenhum registro de consulta encontrado.', margin, y);
    }

    // Rodapé executivo
    this.adicionarRodapeExecutivo(doc, pageWidth, pageHeight);

    // Salvar
    const nomeArquivo = this.pacienteInfo
      ? `Historico_${this.pacienteInfo.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      : `Historico_Paciente_${new Date().toISOString().split('T')[0]}.pdf`;

    doc.save(nomeArquivo);
  }

  // ========== MÉTODOS AUXILIARES DO LAYOUT MODERNO ==========

  /**
   * Adiciona cabeçalho executivo moderno
   */
  private adicionarCabecalhoExecutivo(doc: any, pageWidth: number, margin: number, y: number) {
    // Background cinza executivo
    doc.setFillColor(44, 62, 80);
    doc.rect(margin, y - 10, pageWidth - (margin * 2), 15, 'F');

    // Título principal
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('HISTÓRICO MÉDICO COMPLETO', pageWidth / 2, y, { align: 'center' });

    // Subtítulo
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    doc.text('Relatório Executivo de Consultas e Prontuários', pageWidth / 2, y + 4, { align: 'center' });
  }

  /**
   * Adiciona seção horizontal com barra cinza
   */
  private adicionarSecaoHorizontal(doc: any, titulo: string, margin: number, y: number, pageWidth: number): number {
    // Barra lateral cinza
    doc.setFillColor(107, 114, 128);
    doc.rect(margin, y, 3, 8, 'F');

    // Background da seção
    doc.setFillColor(248, 249, 250);
    doc.rect(margin + 3, y, pageWidth - (margin * 2) - 3, 8, 'F');

    // Título da seção
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128);
    doc.text(titulo.toUpperCase(), margin + 8, y + 5);

    return y + 12;
  }

  /**
   * Adiciona subseção para cada consulta
   */
  private adicionarSubsecao(doc: any, titulo: string, margin: number, y: number, pageWidth: number): number {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text(titulo, margin, y + 3);

    return y + 6;
  }

  /**
   * Adiciona campos em layout horizontal responsivo
   */
  private adicionarCamposHorizontal(doc: any, campos: any[], margin: number, y: number, pageWidth: number): number {
    const availableWidth = pageWidth - (margin * 2);
    const colunas = campos.length;
    const larguraColuna = availableWidth / colunas;
    const alturaCampo = 8;
    let lineY = y;

    // Values com quebra automática de linha - calcular primeiro
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);

    let maxLines = 1;
    const textosProcessados: Array<{ lines: string[], x: number, y: number }> = [];

    campos.forEach((campo, index) => {
      const x = margin + (index * larguraColuna) + 2;
      const valor = campo.value || '-';
      const texto = doc.splitTextToSize(valor, larguraColuna - 4);
      textosProcessados.push({ lines: texto, x: x, y: lineY + 4 });
      maxLines = Math.max(maxLines, texto.length);
    });

    // Calcular altura dinâmica baseada no maior número de linhas
    const alturaDinamica = 4 + (maxLines * 3);

    // Desenhar linhas contínuas do formulário apenas uma vez com altura correta
    doc.setLineWidth(0.1);
    doc.setDrawColor(150, 150, 150);

    campos.forEach((campo, index) => {
      const x = margin + (index * larguraColuna);

      // Linha superior contínua
      doc.line(x, lineY - 2, x + larguraColuna, lineY - 2);

      // Linha inferior contínua com altura dinâmica
      doc.line(x, lineY + alturaDinamica - 1, x + larguraColuna, lineY + alturaDinamica - 1);

      // Linhas verticais contínuas separadoras (exceto na última coluna)
      if (index < colunas - 1) {
        doc.line(x + larguraColuna, lineY - 2, x + larguraColuna, lineY + alturaDinamica - 1);
      }
    });

    // Labels
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(102, 102, 102);
    campos.forEach((campo, index) => {
      const x = margin + (index * larguraColuna) + 2;
      doc.text(campo.label.toUpperCase(), x, lineY);
    });

    // Adicionar textos
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    textosProcessados.forEach(texto => {
      doc.text(texto.lines, texto.x, texto.y);
    });

    return lineY + alturaDinamica + 2;
  }

  /**
   * Adiciona caixa de texto expansível para observações
   */
  private adicionarCaixaExpansivel(doc: any, label: string, texto: string, margin: number, y: number, pageWidth: number, pageHeight: number): number {
    const availableWidth = pageWidth - (margin * 2);
    const lineHeight = 3;

    // Verifica espaço disponível
    if (y + 20 > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    // Calcular altura necessária baseada no texto
    const linhas = doc.splitTextToSize(texto || '-', availableWidth - 10);
    const alturaNecessaria = 10 + (linhas.length * 4);

    // Background da caixa
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, y - 2, availableWidth, alturaNecessaria, 'F');

    // Borda contínua
    doc.setLineWidth(0.1);
    doc.setDrawColor(150, 150, 150);

    // Linhas contínuas da caixa
    doc.line(margin, y - 2, margin + availableWidth, y - 2); // Superior
    doc.line(margin, y - 2, margin, y + alturaNecessaria - 2); // Esquerda
    doc.line(margin + availableWidth, y - 2, margin + availableWidth, y + alturaNecessaria - 2); // Direita
    doc.line(margin, y + alturaNecessaria - 2, margin + availableWidth, y + alturaNecessaria - 2); // Inferior

    // Label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128);
    doc.text(label, margin + 3, y + 2);

    // Texto quebrado em linhas
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(linhas, margin + 3, y + 8);

    return y + alturaNecessaria + 4;
  }

  /**
   * Adiciona rodapé executivo
   */
  private adicionarRodapeExecutivo(doc: any, pageWidth: number, pageHeight: number) {
    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Linha decorativa cinza
      doc.setDrawColor(107, 114, 128);
      doc.setLineWidth(0.5);
      doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

      // Texto do rodapé
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Página ${i} de ${totalPages} | Gerado em ${new Date().toLocaleString('pt-BR')}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  }

  /**
   * Trunca texto para caber no espaço disponível
   */
  private truncarTexto(texto: string, maxLength: number): string {
    if (!texto) return '-';
    return texto.length > maxLength ? texto.substring(0, maxLength) + '...' : texto;
  }

  private adicionarSecao(doc: jsPDF, titulo: string, y: number, margin: number, pageWidth: number): number {
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 4, pageWidth - (margin * 2), 7, 'F');
    doc.setDrawColor(44, 62, 80);
    doc.setLineWidth(1);
    doc.line(margin, y - 4, margin, y + 3);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(titulo, margin + 3, y);
    return y + 10;
  }

  private adicionarCampo(doc: jsPDF, label: string, valor: string, y: number, margin: number): number {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(85, 85, 85);
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(26, 26, 26);
    doc.text(valor || '-', margin + 25, y);
    doc.setTextColor(0, 0, 0);
    return y + 5;
  }

  private adicionarBloco(doc: jsPDF, titulo: string, conteudo: string, y: number, margin: number, pageWidth: number, pageHeight: number): number {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo, margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    const linhas = doc.splitTextToSize(conteudo, pageWidth - (margin * 2));
    doc.text(linhas, margin, y);
    y += linhas.length * 3.5 + 3;
    return y;
  }

  private formatarData(data: string): string {
    if (!data) return '-';
    try {
      const d = new Date(data);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  }

  private formatarHora(dataHora: string): string {
    if (!dataHora) return '-';
    try {
      const d = new Date(dataHora);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '-';
    }
  }
}
