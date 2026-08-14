import { Component, OnInit } from '@angular/core';
import { ControleAcessoApiService } from 'src/app/services/api/controle-acesso-api.service';
import { ProfissionalApiService } from 'src/app/services/api/profissional-api.service';
import { RelatorioApiService } from 'src/app/services/api/relatorio-api.service';
import {
  ConsultaRelatorio,
  DocumentoRelatorio,
  PacienteAtendido,
  TipoDocumento
} from 'src/app/util/variados/interfaces/relatorio/relatorio-paciente';
import { RelatorioService } from '../relatorio.service';
import { META_DOCUMENTO_PADRAO, META_DOCUMENTOS, MetaDocumento } from './relatorios-pacientes.meta';

/** Profissional exibido no filtro da visao administrativa. */
interface ProfissionalFiltro {
  id: number;
  nome: string;
  especialidade: string;
}

/** Opcoes de ordenacao da lista de pacientes. */
type OrdenacaoLista = 'RECENTE' | 'NOME' | 'DOCUMENTOS';

/**
 * Tela de relatorios por paciente.
 *
 * Profissional visualiza apenas os pacientes que atendeu, restricao aplicada
 * pelo backend. Admin e Secretaria visualizam a organizacao inteira e podem
 * filtrar por profissional.
 */
@Component({
  selector: 'app-relatorios-pacientes',
  templateUrl: './relatorios-pacientes.component.html',
  styleUrls: ['./relatorios-pacientes.component.css']
})
export class RelatoriosPacientesComponent implements OnInit {

  profissionais: ProfissionalFiltro[] = [];

  /** Visao administrativa habilita o filtro por profissional. */
  visaoAdministrativa = false;

  termoBusca = '';
  profissionalFiltroId: number | null = null;
  tipoDocumentoFiltro: TipoDocumento | 'TODOS' = 'TODOS';
  ordenacao: OrdenacaoLista = 'RECENTE';

  pacientes: PacienteAtendido[] = [];
  pacientesFiltrados: PacienteAtendido[] = [];
  pacienteSelecionado: PacienteAtendido | null = null;
  consultaExpandidaId: number | null = null;

  isCarregando = false;
  mensagemErro = '';

  constructor(
    private controleAcesso: ControleAcessoApiService,
    private relatorioApi: RelatorioApiService,
    private profissionalApi: ProfissionalApiService,
    private relatorioService: RelatorioService
  ) { }

  ngOnInit(): void {
    this.visaoAdministrativa = this.controleAcesso.isAdmin() || this.controleAcesso.isRecepcionista();

    if (this.visaoAdministrativa) {
      this.carregarProfissionais();
    }

    this.carregarPacientes();
  }

  // ── Carga de dados ─────────────────────────────────────

  /**
   * Carrega os pacientes atendidos com seus relatorios.
   * A restricao por profissional logado e aplicada no backend.
   */
  carregarPacientes(): void {
    this.isCarregando = true;
    this.mensagemErro = '';

    this.relatorioApi.buscarPacientesAtendidos({
      profissionalId: this.visaoAdministrativa ? this.profissionalFiltroId : null,
      termo: this.termoBusca
    }).subscribe({
      next: pacientes => {
        this.pacientes = pacientes ?? [];
        this.aplicarFiltros();
        this.isCarregando = false;
      },
      error: () => {
        this.pacientes = [];
        this.pacientesFiltrados = [];
        this.pacienteSelecionado = null;
        this.mensagemErro = 'Não foi possível carregar os relatórios. Tente novamente.';
        this.isCarregando = false;
      }
    });
  }

  /** Carrega os profissionais usados no filtro da visao administrativa. */
  private carregarProfissionais(): void {
    this.profissionalApi.buscarTodosClinicosByOrg().subscribe({
      next: profissionais => {
        this.profissionais = (profissionais ?? []).map((prof: any) => ({
          id: prof.id,
          nome: prof.nome,
          especialidade: prof.especialidades?.[0]?.nome ?? 'Sem especialidade'
        }));
      },
      error: () => {
        this.profissionais = [];
      }
    });
  }

  // ── Filtros e ordenacao ────────────────────────────────

  /** Reaplica busca, filtros e ordenacao sobre a lista de pacientes. */
  aplicarFiltros(): void {
    const termo = this.termoBusca.trim().toLowerCase();

    let resultado = this.pacientes.filter(paciente => {
      const atendeBusca = !termo
        || paciente.nome.toLowerCase().includes(termo)
        || (paciente.cpf ?? '').includes(termo)
        || (paciente.telefone ?? '').includes(termo);

      const atendeProfissional = !this.profissionalFiltroId
        || paciente.consultas.some(c => c.profissionalId === Number(this.profissionalFiltroId));

      const atendeTipo = this.tipoDocumentoFiltro === 'TODOS'
        || paciente.consultas.some(c => c.documentos.some(d => d.tipo === this.tipoDocumentoFiltro));

      return atendeBusca && atendeProfissional && atendeTipo;
    });

    resultado = this.ordenarPacientes(resultado);
    this.pacientesFiltrados = resultado;

    const selecionadoSaiuDaLista = this.pacienteSelecionado
      && !resultado.some(p => p.id === this.pacienteSelecionado!.id);

    if (selecionadoSaiuDaLista) {
      this.pacienteSelecionado = null;
    }
  }

  /**
   * Ordena a lista de pacientes conforme o criterio selecionado.
   *
   * @param lista pacientes ja filtrados
   * @returns nova lista ordenada
   */
  private ordenarPacientes(lista: PacienteAtendido[]): PacienteAtendido[] {
    const copia = [...lista];

    switch (this.ordenacao) {
      case 'NOME':
        return copia.sort((a, b) => a.nome.localeCompare(b.nome));
      case 'DOCUMENTOS':
        return copia.sort((a, b) => b.totalDocumentos - a.totalDocumentos);
      default:
        return copia.sort((a, b) =>
          new Date(b.ultimoAtendimento).getTime() - new Date(a.ultimoAtendimento).getTime());
    }
  }

  /** Restaura busca, filtros e ordenacao, recarregando os dados do backend. */
  limparFiltros(): void {
    this.termoBusca = '';
    this.profissionalFiltroId = null;
    this.tipoDocumentoFiltro = 'TODOS';
    this.ordenacao = 'RECENTE';
    this.carregarPacientes();
  }

  // ── Selecao ────────────────────────────────────────────

  /**
   * Seleciona um paciente e expande automaticamente a consulta mais recente.
   *
   * @param paciente paciente escolhido na lista
   */
  selecionarPaciente(paciente: PacienteAtendido): void {
    this.pacienteSelecionado = paciente;
    this.consultaExpandidaId = paciente.consultas.length ? paciente.consultas[0].id : null;
  }

  /** Fecha o painel de detalhes do paciente. */
  fecharDetalhe(): void {
    this.pacienteSelecionado = null;
    this.consultaExpandidaId = null;
  }

  /**
   * Alterna a exibicao dos documentos de uma consulta.
   *
   * @param consultaId id da consulta clicada
   */
  alternarConsulta(consultaId: number): void {
    this.consultaExpandidaId = this.consultaExpandidaId === consultaId ? null : consultaId;
  }

  // ── Dados derivados para o template ────────────────────

  /** Lista de tipos de documento disponiveis no filtro. */
  get tiposDocumento(): TipoDocumento[] {
    return Object.keys(META_DOCUMENTOS) as TipoDocumento[];
  }

  /**
   * Retorna os metadados de exibicao de um tipo de documento.
   *
   * @param tipo tipo informado pelo backend
   * @returns icone, cor e rotulo, com fallback para tipos nao mapeados
   */
  meta(tipo: TipoDocumento): MetaDocumento {
    return META_DOCUMENTOS[tipo] ?? META_DOCUMENTO_PADRAO;
  }

  /** Consultas do paciente selecionado, respeitando o filtro de tipo de documento. */
  get consultasDoPaciente(): ConsultaRelatorio[] {
    if (!this.pacienteSelecionado) return [];
    if (this.tipoDocumentoFiltro === 'TODOS') return this.pacienteSelecionado.consultas;

    return this.pacienteSelecionado.consultas
      .filter(c => c.documentos.some(d => d.tipo === this.tipoDocumentoFiltro));
  }

  /** Total de documentos exibidos na lista filtrada. */
  get totalDocumentosFiltrados(): number {
    return this.pacientesFiltrados.reduce((total, p) => total + p.totalDocumentos, 0);
  }

  /**
   * Documentos de uma consulta, respeitando o filtro de tipo.
   *
   * @param consulta consulta cujos documentos serao listados
   * @returns documentos visiveis
   */
  documentosVisiveis(consulta: ConsultaRelatorio): DocumentoRelatorio[] {
    if (this.tipoDocumentoFiltro === 'TODOS') return consulta.documentos;
    return consulta.documentos.filter(d => d.tipo === this.tipoDocumentoFiltro);
  }

  /**
   * Calcula a idade a partir da data de nascimento.
   *
   * @param dataNascimento data no formato ISO
   * @returns idade em anos
   */
  calcularIdade(dataNascimento: string | null): number | null {
    if (!dataNascimento) return null;

    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  }

  /**
   * Retorna as iniciais do paciente para o avatar.
   *
   * @param nome nome completo
   * @returns até duas iniciais em maiusculo
   */
  obterIniciais(nome: string): string {
    return nome
      .split(' ')
      .filter(parte => parte.length > 2)
      .slice(0, 2)
      .map(parte => parte.charAt(0).toUpperCase())
      .join('');
  }

  /**
   * Classe CSS do badge de status da consulta.
   *
   * @param status status da consulta
   * @returns sufixo de classe correspondente
   */
  obterClasseStatus(status: string): string {
    return `status--${status.toLowerCase()}`;
  }

  // ── Acoes de impressao ─────────────────────────────────

  /**
   * Abre o dialog de impressao correspondente ao documento clicado.
   *
   * @param documento documento selecionado no card
   * @param consulta consulta que originou o documento, usada como contexto do cabecalho
   */
  visualizarDocumento(documento: DocumentoRelatorio, consulta: ConsultaRelatorio): void {
    this.relatorioService.abrirDocumentoDaConsulta(documento.consultaId, documento.tipo, {
      paciente: this.pacienteSelecionado,
      consulta
    });
  }

  /** Abre o historico completo do paciente selecionado. */
  exportarHistoricoCompleto(): void {
    if (!this.pacienteSelecionado) return;

    this.relatorioService.abrirHistoricoCompletoDoPaciente(this.pacienteSelecionado.id);
  }
}
