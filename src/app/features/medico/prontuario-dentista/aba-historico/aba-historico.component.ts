import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ConsultaApiService } from 'src/app/core/data-access/consulta-api.service';
import { TipoProntuario } from '../../consulta-edicao';
import { EdicaoProntuarioService } from '../../edicao-prontuario.service';
import { HistoricoCompletoPacienteResponse } from 'src/app/shared/models/historico-completo-paciente-response.interface';
import { IALocalService, ResumoClinico } from 'src/app/services/ia-local.service';

type AbaResumo = 'visao' | 'vitais' | 'timeline' | 'recomendacoes';

@Component({
  selector: 'app-aba-historico',
  
  templateUrl: './aba-historico.component.html',
  styleUrl: '../prontuario-dentista.component.scss',
  host: { style: 'display: block; width: 100%;' },
})
export class AbaHistoricoComponent implements OnInit, OnDestroy {

  @Input() pacienteId: number | undefined;

  /** Tipo de prontuário que esta aba edita. */
  private readonly tipoProntuario: TipoProntuario = 'DENTISTA';

  historicoProntuarios: any[] = [];
  historicoCarregado = false;
  historicoLoading = false;

  resumo: ResumoClinico | null = null;
  gerandoResumo = false;
  exibirResumo = false;
  abaAtiva: AbaResumo = 'visao';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private consultaApi: ConsultaApiService,
    private iaLocal: IALocalService,
    private edicaoProntuario: EdicaoProntuarioService
  ) {}

  ngOnInit(): void {
    if (this.pacienteId && !this.historicoCarregado) {
      this.carregarHistoricoPaciente(this.pacienteId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private carregarHistoricoPaciente(pacienteId: number): void {
    if (this.historicoCarregado) return;

    this.historicoLoading = true;
    this.resumo = null;
    this.exibirResumo = false;

    this.consultaApi.BuscandoHistoricoDeConsultasDoPaciente(pacienteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lista) => {
          this.historicoProntuarios = lista || [];
          this.historicoCarregado = true;
          this.historicoLoading = false;
        },
        error: () => {
          this.historicoProntuarios = [];
          this.historicoCarregado = true;
          this.historicoLoading = false;
        }
      });
  }

  calcularTotalPlanejamentos(planejamentos: any[]): number {
    if (!planejamentos || planejamentos.length === 0) return 0;
    return planejamentos.reduce((sum: number, item: any) => sum + (item.valor || 0), 0);
  }

  formatarOdontograma(dentes: any[]): string {
    if (!dentes || dentes.length === 0) return '';
    return dentes.map(d => {
      let texto = `Dente ${d.numeroFdi}: ${d.status}`;
      if (d.observacao) texto += ` — ${d.observacao}`;
      return texto;
    }).join('; ');
  }

  /**
   * Abre a edição do prontuário do registro. Se o usuário salvar, recarrega o histórico
   * (a tela de edição já mostra a mensagem de sucesso).
   *
   * @param registro item do histórico que o profissional pediu para editar
   */
  editarRegistro(registro: HistoricoCompletoPacienteResponse): void {
    const pacienteId = registro.pacienteId || this.pacienteId;
    if (!pacienteId) return;
    this.edicaoProntuario.editar(this.tipoProntuario, {
      id: registro.consultaId,
      pacienteId,
      profissionalId: registro.profissionalId,
      pacienteNome: registro.pacienteNome,
    }).pipe(takeUntil(this.destroy$)).subscribe(salvou => {
      if (salvou) {
        this.historicoCarregado = false;
        this.carregarHistoricoPaciente(pacienteId);
      }
    });
  }

  toggleResumo(): void {
    if (!this.exibirResumo && !this.resumo) {
      this.gerarResumo();
    } else {
      this.exibirResumo = !this.exibirResumo;
    }
  }

  regerarResumo(): void {
    this.resumo = null;
    this.gerarResumo();
  }

  private gerarResumo(): void {
    if (!this.historicoProntuarios.length || this.gerandoResumo) return;
    this.gerandoResumo = true;
    this.exibirResumo = true;
    this.abaAtiva = 'visao';

    setTimeout(() => {
      try {
        this.resumo = this.iaLocal.analisarHistorico(this.historicoProntuarios, 'dentista');
      } catch (e) {
        console.error('Erro IA local:', e);
      }
      this.gerandoResumo = false;
    }, 800);
  }

  setAba(aba: AbaResumo): void {
    this.abaAtiva = aba;
  }

  // helpers template
  getBarWidth(valor: number, max: number): string {
    return Math.min(100, Math.round((valor / Math.max(max, 1)) * 100)) + '%';
  }

  calcularImc(peso: string, altura: string): { valor: number; label: string } | null {
    const p = parseFloat(peso?.replace(',', '.'));
    const a = parseFloat(altura?.replace(',', '.').replace('m', '').trim());
    if (!p || !a || a < 1) return null;
    const h = a < 3 ? a : a / 100;
    const imc = p / (h * h);
    let label = '';
    if (imc < 18.5) label = 'abaixo do peso';
    else if (imc < 25) label = 'adequado';
    else if (imc < 30) label = 'sobrepeso';
    else label = 'obesidade';
    return { valor: Math.round(imc * 10) / 10, label };
  }
}
