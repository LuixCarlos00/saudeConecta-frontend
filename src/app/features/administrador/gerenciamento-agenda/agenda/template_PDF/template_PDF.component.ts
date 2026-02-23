import { ProfissionalApiService } from 'src/app/services/api/profissional-api.service';
import {
  Component,
  Inject,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { DialogService } from 'src/app/util/variados/dialogo-confirmação/dialog.service';
import { jsPDF } from 'jspdf';
import { MatCalendar } from '@angular/material/datepicker';
import { CampoPDF, ConfiguracaoPDF, CAMPOS_PDF_PADRAO } from './pdf-campos.interface';
import { Consultav2 } from 'src/app/util/variados/interfaces/consulta/consultav2';
import { PacienteApiService } from 'src/app/services';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-template_PDF',
  templateUrl: './template_PDF.component.html',
  styleUrls: ['./template_PDF.component.css'],
})
export class Template_PDFComponent implements OnInit, AfterViewInit {
  @ViewChild('calendar') calendar!: MatCalendar<Date>;

  selected: Date = new Date();
  activeDate: Date = new Date();

  // Configuração de campos dinâmicos do PDF
  configuracaoCampos: ConfiguracaoPDF;

  // Controle de etapas: 'configuracao' | 'previsualizacao'
  etapaAtual: 'configuracao' | 'previsualizacao' = 'configuracao';

  // Controle de loading/progresso
  gerandoPDF: boolean = false;
  progressoPDF: number = 0;

  // Dados puros do backend
  consulta: any;
  profissional: any = null;
  paciente: any = null;

  today: Date = new Date();

  // Controle de carregamento de dados
  dadosCarregados: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<Template_PDFComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Consultav2,
    private DialogService: DialogService,
    private consultaApi: ConsultaApiService,
    private cdr: ChangeDetectorRef,
    private profissionalApiService: ProfissionalApiService,
    private pacienteApiService: PacienteApiService,
    private snackBar: MatSnackBar
  ) {
    console.log('Dados recebidos para PDF:', this.data);

    // Armazena os dados da consulta
    this.consulta = this.data;
    this.activeDate = this.criarDataComTimeZone(this.consulta.dataHora?.split('T')[0]);

    console.log('Consulta:', this.consulta);
    console.log('ActiveDate:', this.activeDate);

    // Inicializa configuração de campos com deep copy para evitar mutação
    this.configuracaoCampos = this.clonarConfiguracaoPadrao();
  }

  ngOnInit() {
    this.buscarDadosCompletos();
  }

  buscarDadosCompletos() {
    let profissionalCarregado = false;
    let pacienteCarregado = false;

    const verificarCarregamentoCompleto = () => {
      if (profissionalCarregado && pacienteCarregado) {
        this.dadosCarregados = true;
        this.atualizarDisponibilidadeCampos();
        this.cdr.detectChanges();
      }
    };

    // Buscar dados completos do profissional
    if (this.consulta.profissionalId) {
      this.profissionalApiService.buscarClinicoIdByOrg(this.consulta.profissionalId).subscribe(
        (profissional: any) => {
          console.log('Profissional encontrado:', profissional);
          this.profissional = profissional;
          profissionalCarregado = true;
          verificarCarregamentoCompleto();
        },
        (error) => {
          console.error('Erro ao buscar profissional:', error);
          profissionalCarregado = true;
          verificarCarregamentoCompleto();
        }
      );
    } else {
      profissionalCarregado = true;
      verificarCarregamentoCompleto();
    }

    // Buscar dados completos do paciente
    if (this.consulta.pacienteId) {
      this.pacienteApiService.buscarrPacientebyOrg(this.consulta.pacienteId).subscribe(
        (paciente: any) => {
          console.log('Paciente encontrado:', paciente);
          this.paciente = paciente;
          pacienteCarregado = true;
          verificarCarregamentoCompleto();
        },
        (error) => {
          console.error('Erro ao buscar paciente:', error);
          pacienteCarregado = true;
          verificarCarregamentoCompleto();
        }
      );
    } else {
      pacienteCarregado = true;
      verificarCarregamentoCompleto();
    }
  }

  /**
   * Atualiza a disponibilidade dos campos baseado nos dados carregados
   */
  atualizarDisponibilidadeCampos() {
    // Validar campos do profissional
    this.configuracaoCampos.profissional.forEach(campo => {
      if (!campo.obrigatorio) {
        campo.disponivel = this.validarDisponibilidadeCampo('profissional', campo.id);
        if (!campo.disponivel) {
          campo.selecionado = false;
        }
      }
    });

    // Validar campos do paciente
    this.configuracaoCampos.paciente.forEach(campo => {
      if (!campo.obrigatorio) {
        campo.disponivel = this.validarDisponibilidadeCampo('paciente', campo.id);
        if (!campo.disponivel) {
          campo.selecionado = false;
        }
      }
    });

    // Validar campos da consulta
    this.configuracaoCampos.consulta.forEach(campo => {
      if (!campo.obrigatorio) {
        campo.disponivel = this.validarDisponibilidadeCampo('consulta', campo.id);
        if (!campo.disponivel) {
          campo.selecionado = false;
        }
      }
    });
  }

  /**
   * Valida se o campo tem dados disponíveis
   */
  validarDisponibilidadeCampo(categoria: string, campoId: string): boolean {
    switch (categoria) {
      case 'profissional':
        return this.validarCampoProfissional(campoId);
      case 'paciente':
        return this.validarCampoPaciente(campoId);
      case 'consulta':
        return this.validarCampoConsulta(campoId);
      default:
        return true;
    }
  }

  private validarCampoProfissional(campoId: string): boolean {
    if (!this.profissional) return false;

    switch (campoId) {
      case 'nome':
        return !!(this.profissional.nome || this.consulta.profissionalNome);
      case 'registroConselho':
        return !!(this.profissional.registroConselho);
      case 'especialidades':
        return !!(this.profissional.especialidades?.length > 0 || this.consulta.especialidadeNome);
      case 'tipoProfissional':
        return !!(this.profissional.tipoProfissional);
      case 'cpf':
        return !!(this.profissional.cpf);
      case 'enderecoCompleto':
        return !!(this.profissional.endereco);
      default:
        return true;
    }
  }

  private validarCampoPaciente(campoId: string): boolean {
    if (!this.paciente) return false;

    switch (campoId) {
      case 'nome':
        return !!(this.paciente.nome || this.consulta.pacienteNome);
      case 'cpf':
        return !!(this.paciente.cpf);
      case 'sexo':
        return !!(this.paciente.sexo);
      case 'email':
        return !!(this.paciente.email);
      case 'telefone':
        return !!(this.paciente.telefone);
      case 'enderecoCompleto':
        return !!(this.paciente.endereco);
      case 'status':
        return !!(this.paciente.status);
      default:
        return true;
    }
  }

  private validarCampoConsulta(campoId: string): boolean {
    switch (campoId) {
      case 'diaSemana':
      case 'dataHora':
        return !!(this.consulta.dataHora);
      case 'status':
        return !!(this.consulta.status);
      case 'observacoes':
        return !!(this.consulta.observacoes);
      case 'valor':
        return !!(this.consulta.valor);
      case 'formaPagamentoNome':
        return !!(this.consulta.formaPagamentoNome);
      default:
        return true;
    }
  }

  ngAfterViewInit() {
    if (this.etapaAtual === 'previsualizacao') {
      this.updateCalendar();
    }
  }

  updateCalendar() {
    setTimeout(() => {
      if (this.calendar) {
        this.selected = this.activeDate;
        this.calendar.activeDate = this.activeDate;
        this.calendar.updateTodaysDate();
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Obtém o dia da semana a partir de uma data ISO
   */
  getDiaSemana(dataHora: string): string {
    if (!dataHora) return '';

    const data = new Date(dataHora);
    const diasSemana = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado'
    ];

    return diasSemana[data.getDay()];
  }

  /**
   * Calcula idade a partir da data de nascimento
   */
  calcularIdade(dataNascimento: string): number {
    if (!dataNascimento) return 0;

    // Remove formatação se houver (dd/mm/yyyy -> yyyy-mm-dd)
    let dataFormatada = dataNascimento;
    if (dataNascimento.includes('/')) {
      const partes = dataNascimento.split('/');
      dataFormatada = `${partes[2]}-${partes[1]}-${partes[0]}`;
    }

    const hoje = new Date();
    const nascimento = new Date(dataFormatada);

    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();

    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }

    return idade;
  }

  /**
   * Formata endereço completo
   */
  formatarEnderecoCompleto(endereco: any): string {
    if (!endereco) return '';

    const partes = [];
    if (endereco.rua) partes.push(endereco.rua);
    if (endereco.numero) partes.push(endereco.numero);
    if (endereco.complemento) partes.push(endereco.complemento);
    if (endereco.bairro) partes.push(endereco.bairro);
    if (endereco.municipio && endereco.uf) partes.push(`${endereco.municipio}/${endereco.uf}`);
    if (endereco.cep) partes.push(`CEP: ${endereco.cep}`);

    return partes.join(', ');
  }

  /**
   * Obtém valor do campo profissional
   */
  getValorCampoProfissional(campoId: string): string {
    if (!this.profissional) return '';

    switch (campoId) {
      case 'nome':
        return this.profissional.nome || this.consulta.profissionalNome || '';
      case 'conselho':
        return this.profissional.conselho || '';
      case 'registroConselho':
        return this.profissional.registroConselho || '';
      case 'especialidades':
        return this.profissional.especialidades?.[0]?.nome || this.consulta.especialidadeNome || '';
      case 'tipoProfissional':
        return this.profissional.tipoProfissional || '';
      case 'email':
        return this.profissional.email || '';
      case 'telefone':
        return this.profissional.telefone || '';
      case 'cpf':
        return this.profissional.cpf || '';
      case 'rg':
        return this.profissional.rg || '';
      case 'sexo':
        return this.profissional.sexo || '';
      case 'idade':
        const idadeProf = this.calcularIdade(this.profissional.dataNascimento);
        return idadeProf > 0 ? `${idadeProf} anos` : '';
      case 'enderecoCompleto':
        return this.formatarEnderecoCompleto(this.profissional.endereco);
      case 'formacao':
        return this.profissional.formacao || '';
      case 'instituicao':
        return this.profissional.instituicao || '';
      default:
        return '';
    }
  }

  /**
   * Obtém valor do campo paciente
   */
  getValorCampoPaciente(campoId: string): string {
    if (!this.paciente) return '';

    switch (campoId) {
      case 'nome':
        return this.paciente.nome || this.consulta.pacienteNome || '';
      case 'cpf':
        return this.paciente.cpf || '';
      case 'rg':
        return this.paciente.rg || '';
      case 'email':
        return this.paciente.email || '';
      case 'telefone':
        return this.paciente.telefone || '';
      case 'sexo':
        return this.paciente.sexo || '';
      case 'idade':
        const idadePac = this.calcularIdade(this.paciente.dataNascimento);
        return idadePac > 0 ? `${idadePac} anos` : '';
      case 'enderecoCompleto':
        return this.formatarEnderecoCompleto(this.paciente.endereco);
      default:
        return '';
    }
  }

  /**
   * Obtém valor do campo consulta
   */
  private getValorCampoConsulta(campoId: string): string {
    switch (campoId) {
      case 'dataHora':
        return `${this.formatarData(this.consulta.dataHora?.split('T')[0])} ${this.consulta.dataHora?.split('T')[1]?.substring(0, 5)}`;
      case 'diaSemana':
        return this.getDiaSemana(this.consulta.dataHora);
      case 'dataHoraFim':
        return this.consulta.dataHoraFim?.split('T')[1]?.substring(0, 5) || '';
      case 'duracaoMinutos':
        return `${this.consulta.duracaoMinutos} min`;
      case 'status':
        return this.consulta.status;
      case 'createdAt':
        return this.formatarData(this.consulta.createdAt?.split('T')[0]);
      case 'formaPagamentoNome':
        return this.consulta.formaPagamentoNome;
      case 'valor':
        return `R$ ${this.consulta.valor.toFixed(2)}`;
      case 'canceladoPor':
        return this.consulta.canceladoPor;
      case 'motivoCancelamento':
        return this.consulta.motivoCancelamento;
      default:
        return '';
    }
  }

  GerarPDF(): void {
    this.gerandoPDF = true;
    this.progressoPDF = 10;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.executarGeracaoPDF();
    }, 50);
  }

  private executarGeracaoPDF(): void {
    try {
      this.progressoPDF = 30;
      this.cdr.detectChanges();

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = 20;
      let paginaAtual = 1;

      // ========== CABEÇALHO MODERNO ==========
      doc.setFillColor(44, 62, 80);
      doc.rect(0, 0, pageWidth, 25, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('COMPROVANTE DE CONSULTA', pageWidth / 2, 16, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 200, 200);
      doc.text(`Consulta Nº ${this.consulta.id || '000000'}`, pageWidth / 2, 20, { align: 'center' });

      if (this.isCampoSelecionado('consulta', 'status')) {
        const statusColor = this.getStatusColor(this.consulta.status);
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.roundedRect(pageWidth / 2 - 10, 15, 20, 4, 1, 1, 'F');
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.text(this.consulta.status, pageWidth / 2, 18, { align: 'center' });
      }

      doc.setTextColor(0, 0, 0);
      y = 35;

      this.progressoPDF = 40;
      this.cdr.detectChanges();

      // ========== LAYOUT COM LINHAS - SEÇÃO PROFISSIONAL ==========
      const camposProfissional = this.configuracaoCampos.profissional.filter(c => c.selecionado && c.disponivel);
      if (camposProfissional.length > 0) {
        y = this.adicionarSecaoVertical(doc, 'DADOS DO PROFISSIONAL', null, y, margin, pageWidth);
        
        // Separar campo ENDEREÇO COMPLETO para tratamento especial
        const campoEndereco = camposProfissional.find(c => c.label === 'Endereço Completo');
        const outrosCampos = camposProfissional.filter(c => c.label !== 'Endereço Completo');
        
        // Campos horizontais (exceto endereço)
        const camposFormatados = outrosCampos.map(campo => ({
          label: campo.label,
          value: this.getValorCampoProfissional(campo.id)
        })).filter(c => c.value);
        
        if (camposFormatados.length > 0) {
          y = this.adicionarCamposHorizontal(doc, camposFormatados, y, margin, pageWidth);
        }
        
        // Campo ENDEREÇO COMPLETO em linha separada (colada com a de cima)
        if (campoEndereco) {
          const valorEndereco = this.getValorCampoProfissional(campoEndereco.id);
          if (valorEndereco) {
            y = this.adicionarCampoEnderecoSeparado(doc, campoEndereco.label, valorEndereco, y, margin, pageWidth);
          }
        }
        
        y += 3;
      }

      this.progressoPDF = 55;
      this.cdr.detectChanges();

      // ========== SEÇÃO PACIENTE ==========
      const camposPaciente = this.configuracaoCampos.paciente.filter(c => c.selecionado && c.disponivel);
      if (camposPaciente.length > 0) {
        y = this.adicionarSecaoVertical(doc, 'DADOS DO PACIENTE', null, y, margin, pageWidth);
        
        // Separar campo ENDEREÇO COMPLETO para tratamento especial
        const campoEnderecoPaciente = camposPaciente.find(c => c.label === 'Endereço Completo');
        const outrosCamposPaciente = camposPaciente.filter(c => c.label !== 'Endereço Completo');
        
        // Campos horizontais (exceto endereço)
        const camposFormatados = outrosCamposPaciente.map(campo => ({
          label: campo.label,
          value: this.getValorCampoPaciente(campo.id)
        })).filter(c => c.value);
        
        if (camposFormatados.length > 0) {
          y = this.adicionarCamposHorizontal(doc, camposFormatados, y, margin, pageWidth);
        }
        
        // Campo ENDEREÇO COMPLETO em linha separada (colada com a de cima)
        if (campoEnderecoPaciente) {
          const valorEnderecoPaciente = this.getValorCampoPaciente(campoEnderecoPaciente.id);
          if (valorEnderecoPaciente) {
            y = this.adicionarCampoEnderecoSeparado(doc, campoEnderecoPaciente.label, valorEnderecoPaciente, y, margin, pageWidth);
          }
        }
        
        y += 3;
      }

      this.progressoPDF = 70;
      this.cdr.detectChanges();

      // ========== SEÇÃO CONSULTA ==========
      const camposConsulta = this.configuracaoCampos.consulta.filter(c => c.selecionado && c.disponivel);
      if (camposConsulta.length > 0) {
        y = this.adicionarSecaoVertical(doc, 'INFORMAÇÕES DA CONSULTA', null, y, margin, pageWidth);
        
        const camposFormatados = camposConsulta
          .filter(campo => campo.id !== 'observacoes')
          .map(campo => ({
            label: campo.label,
            value: this.getValorCampoConsulta(campo.id)
          }))
          .filter(c => c.value);
        
        if (camposFormatados.length > 0) {
          y = this.adicionarCamposHorizontal(doc, camposFormatados, y, margin, pageWidth);
        }
        y += 3;
      }

      this.progressoPDF = 80;
      this.cdr.detectChanges();

      // ========== OBSERVAÇÕES ==========
      if (this.isCampoSelecionado('consulta', 'observacoes') && this.consulta.observacoes) {
        const alturaCaixaObservacoes = 30;
        const espacoNecessarioObservacoes = 7.5 + alturaCaixaObservacoes + 2;
        
        const resultadoObservacoes = this.verificarEspacoAdicionarPagina(doc, y, espacoNecessarioObservacoes, pageHeight, margin, pageWidth);
        y = resultadoObservacoes.y;
        paginaAtual += resultadoObservacoes.pagina;
        
        y = this.adicionarSecaoVertical(doc, 'OBSERVAÇÕES', null, y, margin, pageWidth);
        
        // Desenhar caixa de texto
        doc.setLineWidth(0.1);
        doc.setDrawColor(150, 150, 150);
        doc.rect(margin, y, pageWidth - (margin * 2), alturaCaixaObservacoes, 'D');
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        const obsLines = doc.splitTextToSize(this.consulta.observacoes, pageWidth - (margin * 2) - 4);
        
        // Verificar se o texto cabe na caixa, senão aumentar a caixa
        const alturaTextoObservacoes = obsLines.length * 4;
        const alturaRealObservacoes = Math.max(alturaCaixaObservacoes, alturaTextoObservacoes + 10);
        
        if (alturaRealObservacoes > alturaCaixaObservacoes) {
          const espacoAdicionalObservacoes = alturaRealObservacoes - alturaCaixaObservacoes;
          const resultado2 = this.verificarEspacoAdicionarPagina(doc, y - 7.5, espacoNecessarioObservacoes + espacoAdicionalObservacoes, pageHeight, margin, pageWidth);
          y = resultado2.y;
          paginaAtual += resultado2.pagina;
          y = this.adicionarSecaoVertical(doc, 'OBSERVAÇÕES', null, y, margin, pageWidth);
          doc.rect(margin, y, pageWidth - (margin * 2), alturaRealObservacoes, 'D');
        }
        
        doc.text(obsLines, margin + 2, y + 8);
        y += alturaRealObservacoes + 2;
      }

      // ========== CALENDÁRIO ==========
      if (this.isCampoSelecionado('outros', 'calendario')) {
        const espacoNecessarioCalendario = 65;
        const resultadoCalendario = this.verificarEspacoAdicionarPagina(doc, y, espacoNecessarioCalendario, pageHeight, margin, pageWidth);
        y = resultadoCalendario.y;
        paginaAtual += resultadoCalendario.pagina;
        
        y = this.desenharCalendarioCompacto(doc, y, margin, pageWidth);
      }

      this.progressoPDF = 90;
      this.cdr.detectChanges();

      // ========== RODAPÉ ==========
      const footerY = pageHeight - 15;
      doc.setLineWidth(0.3);
      doc.setDrawColor(52, 152, 219);
      doc.line(margin, footerY, pageWidth - margin, footerY);

      const dataEmissao = this.formatarDataHora(new Date());
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(136, 136, 136);
      doc.text(`Emitido em ${dataEmissao}`, pageWidth / 2, footerY + 5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text('Documento válido como comprovante de consulta', pageWidth / 2, footerY + 9, { align: 'center' });

      this.progressoPDF = 100;
      this.cdr.detectChanges();

      // Salvar PDF
      const dataAtual = new Date().toISOString().split('T')[0];
      doc.save(`Consulta_${this.consulta.id}_${dataAtual}.pdf`);

      setTimeout(() => {
        this.gerandoPDF = false;
        this.progressoPDF = 0;
        this.cdr.detectChanges();
      }, 300);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      this.gerandoPDF = false;
      this.progressoPDF = 0;
      this.cdr.detectChanges();
    }
  }

  // Métodos auxiliares para layout com linhas de formulário

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
    doc.text('COMPROVANTE DE CONSULTA', pageWidth / 2, 16, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Consulta Nº ${this.consulta.id || '000000'} - Continuação`, pageWidth / 2, 20, { align: 'center' });

    doc.setTextColor(0, 0, 0);
  }

  // Método para adicionar campo ENDEREÇO COMPLETO em linha separada
  private adicionarCampoEnderecoSeparado(doc: jsPDF, label: string, valor: string, y: number, margin: number, pageWidth: number): number {
    // Desenhar caixa de texto para endereço (altura reduzida) - sem linha superior
    const alturaCaixaEndereco = 10;
    
    doc.setLineWidth(0.1);
    doc.setDrawColor(150, 150, 150);
    
    // Apenas linha inferior (sem linha superior para não duplicar)
    doc.line(margin, y + alturaCaixaEndereco - 1, pageWidth - margin, y + alturaCaixaEndereco - 1);
    
    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(102, 102, 102);
    doc.text(label.toUpperCase(), margin + 2, y + 0.5);
    
    // Value do endereço
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    
    const maxWidth = pageWidth - (margin * 2) - 4;
    const lines = doc.splitTextToSize(valor || '-', maxWidth);
    doc.text(lines, margin + 2, y + 4.5);
    
    // Ajustar altura baseado no conteúdo (espaço reduzido)
    const alturaTextoEndereco = lines.length * 3.5 + 4;
    const alturaRealEndereco = Math.max(alturaCaixaEndereco, alturaTextoEndereco);
    
    if (alturaRealEndereco > alturaCaixaEndereco) {
      // Desenhar apenas linha inferior com altura maior
      doc.line(margin, y + alturaRealEndereco - 1, pageWidth - margin, y + alturaRealEndereco - 1);
    }
    
    return y + alturaRealEndereco + 1;
  }

  private hexToRgb(hex: string | null): { r: number, g: number, b: number } {
    if (!hex) return { r: 100, g: 100, b: 100 };
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 100, g: 100, b: 100 };
  }

  public getStatusColor(status: string): number[] {
    switch (status?.toUpperCase()) {
      case 'AGENDADA':
        return [52, 152, 219]; // Azul
      case 'CONCLUIDA':
      case 'CONCLUÍDA':
        return [46, 125, 50]; // Verde
      case 'CANCELADA':
        return [231, 76, 60]; // Vermelho
      default:
        return [85, 85, 85]; // Cinza
    }
  }

  private desenharCalendarioCompacto(doc: jsPDF, y: number, margin: number, pageWidth: number): number {
    const dataConsulta = this.criarDataComTimeZone(this.consulta.dataHora?.split('T')[0]);
    const mes = dataConsulta.getMonth();
    const ano = dataConsulta.getFullYear();
    const diaConsulta = dataConsulta.getDate();

    const contentWidth = pageWidth - (margin * 2);
    y = this.adicionarSecaoVertical(doc, 'CALENDÁRIO', null, y, margin, pageWidth);

    const cellWidth = 6;
    const cellHeight = 5;
    const calendarWidth = cellWidth * 7;
    const startX = (pageWidth - calendarWidth) / 2;

    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text(`${meses[mes]} ${ano}`, pageWidth / 2, y, { align: 'center' });
    y += 4;

    const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(52, 152, 219);
    doc.rect(startX, y - 2, calendarWidth, cellHeight, 'F');
    doc.setTextColor(255, 255, 255);

    for (let i = 0; i < 7; i++) {
      doc.text(diasSemana[i], startX + (i * cellWidth) + cellWidth / 2, y + 1.5, { align: 'center' });
    }
    doc.setTextColor(0, 0, 0);
    y += cellHeight;

    const primeiroDia = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    let dia = 1;
    let linha = 0;

    while (dia <= totalDias) {
      for (let col = 0; col < 7; col++) {
        const x = startX + (col * cellWidth);
        const yCell = y + (linha * cellHeight);

        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.1);
        doc.rect(x, yCell - 2, cellWidth, cellHeight);

        if ((linha === 0 && col >= primeiroDia) || (linha > 0 && dia <= totalDias)) {
          if (dia === diaConsulta) {
            doc.setFillColor(46, 125, 50);
            doc.roundedRect(x + 0.5, yCell - 1.5, cellWidth - 1, cellHeight - 1, 0.5, 0.5, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
          } else {
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'normal');
          }

          doc.text(dia.toString(), x + cellWidth / 2, yCell + 1.5, { align: 'center' });
          dia++;
        }
      }
      linha++;
    }

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    return y + (linha * cellHeight) + 3;
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

  private formatarDataHora(data: Date): string {
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  criarDataComTimeZone(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // ============================================================================
  // MÉTODOS PARA CONFIGURAÇÃO DINÂMICA DO PDF
  // ============================================================================

  private clonarConfiguracaoPadrao(): ConfiguracaoPDF {
    return {
      profissional: CAMPOS_PDF_PADRAO.profissional.map(c => ({ ...c, disponivel: true })),
      paciente: CAMPOS_PDF_PADRAO.paciente.map(c => ({ ...c, disponivel: true })),
      consulta: CAMPOS_PDF_PADRAO.consulta.map(c => ({ ...c, disponivel: true })),
      outros: CAMPOS_PDF_PADRAO.outros.map(c => ({ ...c, disponivel: true }))
    };
  }

  toggleCampo(campo: CampoPDF): void {
    if (campo.obrigatorio || !campo.disponivel) {
      if (!campo.disponivel) {
        this.snackBar.open(
          'Este campo não possui dados para ser exibido no PDF.',
          'OK',
          {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['info-snackbar']
          }
        );
      }
      return;
    }

    campo.selecionado = !campo.selecionado;
  }

  isCampoSelecionado(categoria: keyof ConfiguracaoPDF, campoId: string): boolean {
    const campos = this.configuracaoCampos[categoria];
    const campo = campos.find(c => c.id === campoId);
    return campo ? campo.selecionado : false;
  }

  selecionarTodos(categoria: keyof ConfiguracaoPDF): void {
    this.configuracaoCampos[categoria].forEach(campo => {
      if (campo.disponivel) {
        campo.selecionado = true;
      }
    });
  }

  desmarcarOpcionais(categoria: keyof ConfiguracaoPDF): void {
    this.configuracaoCampos[categoria].forEach(campo => {
      if (!campo.obrigatorio) {
        campo.selecionado = false;
      }
    });
  }

  resetarConfiguracao(): void {
    this.configuracaoCampos = this.clonarConfiguracaoPadrao();
    this.atualizarDisponibilidadeCampos();
  }

  avancarParaPrevisualizacao(): void {
    this.etapaAtual = 'previsualizacao';
    setTimeout(() => this.updateCalendar(), 100);
  }

  voltarParaConfiguracao(): void {
    this.etapaAtual = 'configuracao';
  }

  contarSelecionados(categoria: keyof ConfiguracaoPDF): number {
    return this.configuracaoCampos[categoria].filter(c => c.selecionado).length;
  }

  totalCampos(categoria: keyof ConfiguracaoPDF): number {
    return this.configuracaoCampos[categoria].length;
  }

  contarDisponiveis(categoria: keyof ConfiguracaoPDF): number {
    return this.configuracaoCampos[categoria].filter(c => c.disponivel).length;
  }
}
