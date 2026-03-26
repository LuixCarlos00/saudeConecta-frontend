import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { IALocalService, ResumoClinico } from 'src/app/services/ia-local.service';
import { tokenService } from 'src/app/util/Token/Token.service';

type AbaResumo = 'visao' | 'vitais' | 'timeline' | 'recomendacoes';

@Component({
  selector: 'app-aba-historico-medico',
   templateUrl: './aba-historico-medico.component.html',
  styleUrl: '../prontuario-shared.scss',
  host: { style: 'display: block; width: 100%;' },
})
export class AbaHistoricoMedicoComponent implements OnInit, OnDestroy {

  @Input() pacienteId: number | undefined;

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
    private tokenSvc: tokenService
  ) {}

  ngOnInit(): void {
    if (this.pacienteId && !this.historicoCarregado) {
      this.carregarHistorico(this.pacienteId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private carregarHistorico(pacienteId: number): void {
    if (this.historicoCarregado) return;

    this.historicoLoading = true;
    this.resumo = null;
    this.exibirResumo = false;

    const profissionalId = this.tokenSvc.obterUsuarioId() ?? undefined;
    console.log("pacienteId, 'dentista', profissionalId",pacienteId, 'medico', profissionalId)
    this.consultaApi.BuscandoHistoricoDeConsultasDoPaciente(pacienteId, 'medico', profissionalId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lista) => {
                        console.log('lista',lista)

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
        this.resumo = this.iaLocal.analisarHistorico(this.historicoProntuarios, 'medico');
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