import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HistoricoDadosPessoaisApiService } from 'src/app/features/auditoria/data-access/historico-dados-pessoais-api.service';
import { EntidadeHistorico, HistoricoDadosPessoais } from 'src/app/features/auditoria/models/historico-dados-pessoais';
import { AssinaturaAdminApiService } from 'src/app/features/assinatura';

/** Rótulos dos campos mais comuns; o resto é convertido de camelCase. */
const ROTULOS_CAMPO: Record<string, string> = {
  nome: 'Nome', email: 'E-mail', telefone: 'Telefone', cpf: 'CPF', rg: 'RG', cnpj: 'CNPJ',
  cargo: 'Cargo', razaoSocial: 'Razão social', tipo: 'Tipo', sexo: 'Sexo', dataNascimento: 'Data de nascimento',
  registroConselho: 'Registro no conselho', nacionalidade: 'Nacionalidade',
  endCep: 'CEP', endUF: 'UF', endMunicipio: 'Município', endBairro: 'Bairro', endRua: 'Rua',
  endNumero: 'Número', endComplemento: 'Complemento'
};

/**
 * Auditoria do SUPER_ADMIN: cada campo de cadastro alterado nas clínicas, com o valor de antes e o de depois,
 * quem alterou e quando. Filtros por clínica, tipo de cadastro, período e nome do campo.
 */
@Component({
  selector: 'app-historico-dados-pessoais',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historico-dados-pessoais.component.html',
  styleUrls: ['./historico-dados-pessoais.component.css']
})
export class HistoricoDadosPessoaisComponent implements OnInit, OnDestroy {

  readonly TAMANHO_PAGINA = 20;
  readonly entidades: { valor: EntidadeHistorico; rotulo: string }[] = [
    { valor: 'ORGANIZACAO', rotulo: 'Clínica' },
    { valor: 'ENDERECO', rotulo: 'Endereço' },
    { valor: 'ADMIN', rotulo: 'Administrador' },
    { valor: 'PROFISSIONAL', rotulo: 'Profissional' },
    { valor: 'SECRETARIA', rotulo: 'Secretária' },
    { valor: 'PACIENTE', rotulo: 'Paciente' }
  ];

  historico: HistoricoDadosPessoais[] = [];
  clinicas: { id: number; nome: string }[] = [];
  total = 0;
  pagina = 0;
  totalPaginas = 0;
  loading = false;
  error: string | null = null;

  filtroClinica: number | null = null;
  filtroEntidade: EntidadeHistorico | '' = '';
  filtroDe = '';
  filtroAte = '';
  filtroCampo = '';

  private requisicao?: Subscription;

  constructor(
    private historicoService: HistoricoDadosPessoaisApiService,
    private assinaturaAdminApi: AssinaturaAdminApiService
  ) {}

  ngOnInit(): void {
    this.carregarClinicas();
    this.carregar();
  }

  ngOnDestroy(): void {
    this.requisicao?.unsubscribe();
  }

  /** Clínicas do filtro: uma por assinatura vigente (não há endpoint só de clínicas). */
  private carregarClinicas(): void {
    this.assinaturaAdminApi.listar({ size: 100, sort: 'organizacaoNome,asc' }).subscribe({
      next: pagina => {
        const vistos = new Set<number>();
        this.clinicas = pagina.content
          .filter(a => !vistos.has(a.organizacaoId) && vistos.add(a.organizacaoId))
          .map(a => ({ id: a.organizacaoId, nome: a.organizacaoNome }));
      },
      error: () => { this.clinicas = []; }
    });
  }

  /** Busca a página atual com os filtros; a resposta de uma chamada antiga é descartada. */
  carregar(): void {
    if (this.filtroDe && this.filtroAte && this.filtroAte < this.filtroDe) {
      this.error = 'A data final não pode ser anterior à data inicial.';
      return;
    }
    this.requisicao?.unsubscribe();
    this.loading = true;
    this.error = null;
    this.requisicao = this.historicoService.pesquisar({
      organizacaoId: this.filtroClinica,
      entidade: this.filtroEntidade,
      de: this.filtroDe,
      ate: this.filtroAte,
      campo: this.filtroCampo,
      page: this.pagina,
      size: this.TAMANHO_PAGINA
    }).subscribe({
      next: pagina => {
        this.historico = pagina.content;
        this.total = pagina.totalElements;
        this.totalPaginas = pagina.totalPages;
        this.loading = false;
      },
      error: err => {
        this.historico = [];
        this.total = 0;
        this.totalPaginas = 0;
        this.error = err?.status === 403
          ? 'Acesso negado: só o super administrador vê a auditoria.'
          : 'Não foi possível carregar a auditoria. Tente de novo.';
        this.loading = false;
      }
    });
  }

  /** Aplica os filtros a partir da primeira página. */
  filtrar(): void {
    this.pagina = 0;
    this.carregar();
  }

  limparFiltros(): void {
    this.filtroClinica = null;
    this.filtroEntidade = '';
    this.filtroDe = '';
    this.filtroAte = '';
    this.filtroCampo = '';
    this.filtrar();
  }

  get temFiltro(): boolean {
    return !!(this.filtroClinica || this.filtroEntidade || this.filtroDe || this.filtroAte || this.filtroCampo.trim());
  }

  /**
   * Vai para outra página, se existir.
   *
   * @param pagina índice da página (base 0)
   */
  irPara(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas || pagina === this.pagina) { return; }
    this.pagina = pagina;
    this.carregar();
  }

  get faixa(): string {
    if (this.total === 0) { return '0 de 0'; }
    const inicio = this.pagina * this.TAMANHO_PAGINA + 1;
    const fim = Math.min(inicio + this.historico.length - 1, this.total);
    return `${inicio} – ${fim} de ${this.total}`;
  }

  formatarData(data: string): string {
    if (!data) { return '—'; }
    return new Date(data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getEntidadeLabel(entidade: string): string {
    return this.entidades.find(e => e.valor === entidade)?.rotulo || entidade;
  }

  /**
   * Nome do campo legível: tabela conhecida, senão tira prefixos (paci, end) e separa o camelCase.
   *
   * @param campo nome técnico do campo
   * @returns rótulo para a tela
   */
  getCampoLabel(campo: string): string {
    if (ROTULOS_CAMPO[campo]) { return ROTULOS_CAMPO[campo]; }
    const semPrefixo = campo.replace(/^(paci|end|med|sec)(?=[A-Z])/, '');
    const minusculo = semPrefixo.charAt(0).toLowerCase() + semPrefixo.slice(1);
    if (ROTULOS_CAMPO[minusculo]) { return ROTULOS_CAMPO[minusculo]; }
    const texto = semPrefixo.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  trackPorId(_i: number, item: HistoricoDadosPessoais): number {
    return item.id;
  }
}
