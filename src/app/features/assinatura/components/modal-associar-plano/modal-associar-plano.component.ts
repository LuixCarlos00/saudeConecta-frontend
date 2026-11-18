import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlanoApiService } from 'src/app/core/data-access/plano-api.service';
import { AssinaturaApiService } from 'src/app/core/data-access/assinatura-api.service';
import { CobrancaApiService } from 'src/app/features/assinatura/data-access/cobranca-api.service';
import { PlanoAssinatura, AssinaturaTenant, CobrancaTenant, CustomizarPlanoTenantRequest } from 'src/app/shared/models/PlanoAssinatura';
import { forkJoin } from 'rxjs';
import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { mensagemErroAssinaturaAdmin } from 'src/app/shared/utils/mensagem-erro-http';
import { PlanoDescricaoParserService } from 'src/app/shared/utils/plano-descricao-parser.service';

/** Perfis cujo limite o SUPER_ADMIN pode personalizar por clínica. */
export type CampoLimite = 'admin' | 'prof' | 'sec';

/** Índices das abas do modal. */
export const ABA_PLANO = 0;
export const ABA_COBRANCAS = 1;
export const ABA_PERSONALIZAR = 2;

@Component({
  selector: 'app-modal-associar-plano',
  templateUrl: './modal-associar-plano.component.html',
  styleUrls: ['../../tokens-assinatura.css', '../dialogo-assinatura.css', './modal-associar-plano.component.css']
})
export class ModalAssociarPlanoComponent implements OnInit {

  readonly ABA_PLANO = ABA_PLANO;
  readonly ABA_COBRANCAS = ABA_COBRANCAS;
  readonly ABA_PERSONALIZAR = ABA_PERSONALIZAR;

  /** Linhas da aba Personalizar, na ordem em que aparecem. */
  readonly perfisLimite: { campo: CampoLimite; rotulo: string; singular: string }[] = [
    { campo: 'admin', rotulo: 'Administradores', singular: 'administrador' },
    { campo: 'prof', rotulo: 'Profissionais', singular: 'profissional' },
    { campo: 'sec', rotulo: 'Secretárias', singular: 'secretária' }
  ];

  planos: PlanoAssinatura[] = [];
  planoSelecionado: number | null = null;
  assinaturaAtual: AssinaturaTenant | null = null;
  planoAtualNome: string = '';
  isLoading = true;
  isSaving = false;
  modoEdicao = false;

  cobrancas: CobrancaTenant[] = [];
  isLoadingCobrancas = false;
  confirmandoId: number | null = null;

  // Personalização
  customLimiteAdmin: number | null = null;
  customLimiteProf: number | null = null;
  customLimiteSec: number | null = null;
  isSavingCustom = false;
  planoAtual: PlanoAssinatura | null = null;

  /** Limites como estão salvos no back; servem para saber se há alteração pendente. */
  private limitesSalvos: Record<CampoLimite, number | null> = { admin: null, prof: null, sec: null };

  // Valores calculados (atualizados por recalcularExtras)
  extraAdmin = 0;
  extraProf = 0;
  extraSec = 0;
  custoExtraAdmin = 0;
  custoExtraProf = 0;
  custoExtraSec = 0;
  valorAdicionalTotal = 0;
  valorTotalMensal = 0;

  tabAtiva = ABA_PLANO;

  constructor(
    private notificacao: NotificacaoService,
    public dialogRef: MatDialogRef<ModalAssociarPlanoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { organizacaoId: number; nomeOrganizacao: string },
    private planoApiService: PlanoApiService,
    private assinaturaApiService: AssinaturaApiService,
    private cobrancaApiService: CobrancaApiService,
    private snackBar: MatSnackBar,
    private parser: PlanoDescricaoParserService
  ) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.isLoading = true;

    forkJoin({
      planos: this.planoApiService.listarPlanosAtivos(),
      assinaturas: this.assinaturaApiService.listarPorOrganizacao(this.data.organizacaoId)
    }).subscribe({
      next: ({ planos, assinaturas }) => {
        this.planos = planos;

        if (assinaturas && Array.isArray(assinaturas) && assinaturas.length > 0) {
          const assinaturaAtiva = assinaturas.find(a =>
            a.status === 'TRIAL' || a.status === 'ATIVA' || a.status === 'INADIMPLENTE'
          );

          if (assinaturaAtiva) {
            this.assinaturaAtual = assinaturaAtiva;
            this.planoSelecionado = this.assinaturaAtual.planoId;
            this.planoAtualNome = this.assinaturaAtual.planoNome;
            this.modoEdicao = true;

            this.planoAtual = this.planos.find(p => p.id === assinaturaAtiva.planoId) || null;
            this.customLimiteAdmin = assinaturaAtiva.limiteAdminOrgCustom ?? this.planoAtual?.limiteAdminOrg ?? null;
            this.customLimiteProf = assinaturaAtiva.limiteProfissionalCustom ?? this.planoAtual?.limiteProfissional ?? null;
            this.customLimiteSec = assinaturaAtiva.limiteSecretariaCustom ?? this.planoAtual?.limiteSecretaria ?? null;
            this.limitesSalvos = { admin: this.customLimiteAdmin, prof: this.customLimiteProf, sec: this.customLimiteSec };
            this.recalcularExtras();
          }
        }

        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Erro ao carregar dados', 'Fechar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  /**
   * Carrega cobranças da organização ao trocar para a aba de cobranças.
   * @param index índice da aba selecionada
   */
  onTabChange(index: number): void {
    this.tabAtiva = index;
    if (index === ABA_COBRANCAS && this.cobrancas.length === 0) {
      this.carregarCobrancas();
    }
  }

  carregarCobrancas(): void {
    this.isLoadingCobrancas = true;
    this.cobrancaApiService.listarPorOrganizacao(this.data.organizacaoId).subscribe({
      next: (cobrancas) => {
        this.cobrancas = cobrancas;
        this.isLoadingCobrancas = false;
      },
      error: () => {
        this.snackBar.open('Erro ao carregar cobranças', 'Fechar', { duration: 3000 });
        this.isLoadingCobrancas = false;
      }
    });
  }

  /**
   * Confirma pagamento manualmente (SuperAdmin).
   * @param cobrancaId ID da cobrança
   */
  confirmarPagamento(cobrancaId: number): void {
    this.confirmandoId = cobrancaId;
    this.cobrancaApiService.confirmarPagamento(cobrancaId).subscribe({
      next: () => {
        this.snackBar.open('Pagamento confirmado com sucesso!', 'Fechar', { duration: 3000 });
        this.confirmandoId = null;
        this.carregarCobrancas();
        this.carregarDados();
      },
      error: (err) => {
        const msg = err.error?.message || 'Erro ao confirmar pagamento';
        this.snackBar.open(msg, 'Fechar', { duration: 5000 });
        this.confirmandoId = null;
      }
    });
  }

  associarPlano(): void {
    if (!this.planoSelecionado) {
      this.snackBar.open('Selecione um plano', 'Fechar', { duration: 3000 });
      return;
    }

    if (this.modoEdicao && this.planoSelecionado === this.assinaturaAtual?.planoId) {
      this.snackBar.open('Selecione um plano diferente do atual', 'Fechar', { duration: 3000 });
      return;
    }

    this.isSaving = true;

    this.assinaturaApiService.assinar({ organizacaoId: this.data.organizacaoId, planoId: this.planoSelecionado }).subscribe({
      next: () => {
        const msg = this.modoEdicao ? 'Plano alterado com sucesso!' : 'Plano associado com sucesso!';
        this.snackBar.open(msg, 'Fechar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        const msg = mensagemErroAssinaturaAdmin(err, this.modoEdicao ? 'Erro ao alterar plano' : 'Erro ao associar plano');
        this.snackBar.open(msg, 'Fechar', { duration: 5000 });
        this.isSaving = false;
      }
    });
  }

  fechar(): void {
    this.dialogRef.close(false);
  }

  /**
   * Seleciona um plano na lista (clique na linha inteira, não só no círculo do radio).
   * @param plano plano clicado
   */
  selecionarPlano(plano: PlanoAssinatura): void {
    if (this.isSaving) { return; }
    this.planoSelecionado = plano.id;
  }

  /** Plano escolhido na aba Plano, ou null. */
  get planoEscolhido(): PlanoAssinatura | null {
    return this.planos.find(p => p.id === this.planoSelecionado) || null;
  }

  /** Só deixa trocar quando há um plano escolhido e ele é diferente do atual. */
  get podeTrocarPlano(): boolean {
    if (!this.planoSelecionado || this.isSaving) { return false; }
    return !this.modoEdicao || this.planoSelecionado !== this.assinaturaAtual?.planoId;
  }

  /** Texto do botão principal da aba Plano, já com o nome do plano escolhido. */
  get rotuloAcaoPlano(): string {
    if (this.isSaving) { return this.modoEdicao ? 'Alterando...' : 'Associando...'; }
    const nome = this.planoEscolhido?.nome;
    if (!this.modoEdicao) { return nome ? `Associar ${nome}` : 'Associar plano'; }
    if (!nome || this.planoSelecionado === this.assinaturaAtual?.planoId) { return 'Trocar plano'; }
    return `Trocar para ${nome}`;
  }

  /**
   * Frase curta do plano. O back guarda "titulo: ...\nRecursos: [...]" na descrição;
   * aqui só interessa o título, nunca o texto cru.
   * @param plano plano a descrever
   * @returns título promocional do plano
   */
  tituloDoPlano(plano: PlanoAssinatura): string {
    if (plano.titulo && !plano.titulo.includes('Recursos:')) { return plano.titulo; }
    return this.parser.parse(plano.descricao).titulo;
  }

  formatarValor(valor: number): string {
    return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
  }

  formatarLimite(limite: number | null): string {
    return limite === null ? 'Ilimitado' : `${limite}`;
  }

  /**
   * Limite em texto corrido, no singular ou plural ("1 administrador", "8 profissionais").
   * @param limite limite do plano (null = ilimitado)
   * @param singular nome do perfil no singular
   * @param plural nome do perfil no plural
   * @returns texto para a linha de resumo do plano
   */
  descreverLimite(limite: number | null, singular: string, plural: string): string {
    if (limite === null) { return `${plural} sem limite`; }
    return `${limite} ${limite === 1 ? singular : plural}`;
  }

  /**
   * Rótulo legível do status (o back manda o enum em maiúsculas).
   * @param status status da assinatura ou da cobrança
   * @returns texto para exibir
   */
  rotuloStatus(status: string): string {
    const rotulos: Record<string, string> = {
      'TRIAL': 'Em teste',
      'ATIVA': 'Ativa',
      'INADIMPLENTE': 'Inadimplente',
      'SUSPENSA': 'Suspensa',
      'CANCELADA': 'Cancelada',
      'PENDENTE': 'Pendente',
      'PAGO': 'Pago',
      'EXPIRADO': 'Expirado'
    };
    return rotulos[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'TRIAL': 'status-trial',
      'ATIVA': 'status-ativa',
      'INADIMPLENTE': 'status-inadimplente',
      'SUSPENSA': 'status-suspensa',
      'CANCELADA': 'status-cancelada',
      'PENDENTE': 'status-pendente',
      'PAGO': 'status-pago',
      'EXPIRADO': 'status-expirado'
    };
    return classes[status] || '';
  }

  get cobrancasPendentes(): CobrancaTenant[] {
    return this.cobrancas.filter(c => c.status === 'PENDENTE');
  }


  /**
   * Botões − e + do limite. Nunca deixa ficar abaixo do que o plano já inclui.
   * @param campo perfil a ajustar
   * @param delta +1 ou -1
   */
  ajustarLimite(campo: CampoLimite, delta: number): void {
    const minimo = this.limiteBase(campo) ?? 0;
    const atual = Number(this.lerLimite(campo) ?? minimo);
    this.gravarLimite(campo, Math.max(minimo, atual + delta));
    this.recalcularExtras();
  }

  /**
   * Valor atual do limite de um perfil, para o input.
   * @param campo perfil
   * @returns limite escolhido
   */
  lerLimite(campo: CampoLimite): number | null {
    return { admin: this.customLimiteAdmin, prof: this.customLimiteProf, sec: this.customLimiteSec }[campo];
  }

  /**
   * Grava o limite digitado no input e recalcula os extras.
   * @param campo perfil
   * @param valor valor digitado
   */
  definirLimite(campo: CampoLimite, valor: number | string | null): void {
    this.gravarLimite(campo, valor === '' || valor == null ? null : Number(valor));
    this.recalcularExtras();
  }

  /**
   * Limite incluso no plano para o perfil.
   * @param campo perfil
   * @returns limite do plano, ou null se ilimitado/sem plano
   */
  limiteBase(campo: CampoLimite): number | null {
    if (!this.planoAtual) { return null; }
    return { admin: this.planoAtual.limiteAdminOrg, prof: this.planoAtual.limiteProfissional, sec: this.planoAtual.limiteSecretaria }[campo];
  }

  /**
   * Extras contratados e custo deles para um perfil.
   * @param campo perfil
   * @returns quantidade extra, custo mensal e preço unitário
   */
  extraDo(campo: CampoLimite): { quantidade: number; custo: number; unitario: number } {
    const p = this.planoAtual;
    const mapa = {
      admin: { quantidade: this.extraAdmin, custo: this.custoExtraAdmin, unitario: p?.valorAdicionalAdmin || 0 },
      prof: { quantidade: this.extraProf, custo: this.custoExtraProf, unitario: p?.valorAdicionalProfissional || 0 },
      sec: { quantidade: this.extraSec, custo: this.custoExtraSec, unitario: p?.valorAdicionalSecretaria || 0 }
    };
    return mapa[campo];
  }

  /** Volta os três limites para o que o plano inclui (sem extras). */
  restaurarLimitesDoPlano(): void {
    if (!this.planoAtual) { return; }
    this.customLimiteAdmin = this.planoAtual.limiteAdminOrg;
    this.customLimiteProf = this.planoAtual.limiteProfissional;
    this.customLimiteSec = this.planoAtual.limiteSecretaria;
    this.recalcularExtras();
  }

  /** Há limite diferente do que está salvo? Controla o botão Salvar. */
  get limitesAlterados(): boolean {
    return this.perfisLimite
      .some(({ campo }) => this.normalizar(this.lerLimite(campo)) !== this.normalizar(this.limitesSalvos[campo]));
  }

  /** Há algum perfil contratado além do plano? Controla o atalho de restaurar. */
  get temExtras(): boolean {
    return this.extraAdmin + this.extraProf + this.extraSec > 0;
  }

  private gravarLimite(campo: CampoLimite, valor: number | null): void {
    if (campo === 'admin') { this.customLimiteAdmin = valor; }
    if (campo === 'prof') { this.customLimiteProf = valor; }
    if (campo === 'sec') { this.customLimiteSec = valor; }
  }

  private normalizar(valor: number | null): number | null {
    return valor == null ? null : Number(valor);
  }

  /**
   * Recalcula quantidade de extras e custos para cada perfil.
   */
  private recalcularExtras(): void {
    if (!this.planoAtual) return;

    this.extraAdmin = this.calcularExtra(this.customLimiteAdmin, this.planoAtual.limiteAdminOrg);
    this.extraProf = this.calcularExtra(this.customLimiteProf, this.planoAtual.limiteProfissional);
    this.extraSec = this.calcularExtra(this.customLimiteSec, this.planoAtual.limiteSecretaria);

    this.custoExtraAdmin = this.extraAdmin * (this.planoAtual.valorAdicionalAdmin || 0);
    this.custoExtraProf = this.extraProf * (this.planoAtual.valorAdicionalProfissional || 0);
    this.custoExtraSec = this.extraSec * (this.planoAtual.valorAdicionalSecretaria || 0);

    this.valorAdicionalTotal = this.custoExtraAdmin + this.custoExtraProf + this.custoExtraSec;
    this.valorTotalMensal = this.planoAtual.valorMensal + this.valorAdicionalTotal;
  }

  /**
   * Calcula a quantidade de perfis extras em relação ao limite base do plano.
   * @param limiteCustom limite personalizado desejado
   * @param limitePlano limite padrão do plano
   * @returns quantidade de extras (>= 0)
   */
  private calcularExtra(limiteCustom: number | null, limitePlano: number | null): number {
    if (limiteCustom == null || limitePlano == null) return 0;
    return Math.max(0, Number(limiteCustom) - Number(limitePlano));
  }

  /**
   * Salva a customização dos limites do plano para o tenant (SUPER_ADMIN).
   */
  salvarCustomizacao(): void {
    this.isSavingCustom = true;
    const request: CustomizarPlanoTenantRequest = {
      limiteAdminOrgCustom: this.customLimiteAdmin != null ? Number(this.customLimiteAdmin) : null,
      limiteProfissionalCustom: this.customLimiteProf != null ? Number(this.customLimiteProf) : null,
      limiteSecretariaCustom: this.customLimiteSec != null ? Number(this.customLimiteSec) : null
    };

    this.assinaturaApiService.customizarPlano(this.data.organizacaoId, request).subscribe({
      next: (res) => {
        this.isSavingCustom = false;
        this.notificacao.fire({
          icon: 'success',
          title: 'Limites salvos',
          text: `Nova mensalidade da clínica: ${this.formatarValor(res?.valorMensal)}.`,
          timer: 4000,
          showConfirmButton: true
        });
        this.carregarDados();
      },
      error: (err) => {
        console.error('Erro ao customizar plano:', err);
        this.isSavingCustom = false;
        const msg = mensagemErroAssinaturaAdmin(err, err.message || 'Erro ao personalizar plano');
        this.notificacao.fire({
          icon: 'error',
          title: 'Erro',
          text: msg
        });
      }
    });
  }
}
