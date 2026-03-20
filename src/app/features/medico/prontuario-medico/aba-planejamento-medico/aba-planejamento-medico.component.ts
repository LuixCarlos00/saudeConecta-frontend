import { Component, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ProcedimentoPadraoApiService } from 'src/app/services/api/procedimento-padrao-api.service';
import { PlanejamentoTerapeuticoApiService } from 'src/app/services/api/planejamento-terapeutico-api.service';
import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';
import { ProntuarioApiService } from 'src/app/services/api/prontuario-api.service';
import { Prontuario, PlanejamentoTerapeutico } from 'src/app/util/variados/interfaces/Prontuario/Prontuario';

@Component({
  selector: 'app-aba-planejamento-medico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aba-planejamento-medico.component.html',
  styleUrl: '../prontuario-shared.scss',
  host: { style: 'display: block; width: 100%;' },
})
export class AbaPlanejamentoMedicoComponent implements OnChanges, OnDestroy {

  @Input() profissionalId: number | undefined;
  @Input() consultaId: number | undefined;
  @Input() pacienteId: number | undefined;

  procedimentosPadrao: any[] = [];
  planejamentos: any[] = [];
  novoPlanejamento = { procedimentoRealizado: '', valor: 0, dataProcedimento: '' };
  mostrarFormProcedimento = false;
  novoProcedimentoPadrao = { nomeProcedimento: '', valorPadrao: 0 };
  editandoProcedimentoExistente = false;
  procedimentoOriginal: any = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private procedimentoPadraoApi: ProcedimentoPadraoApiService,
    private planejamentoApi: PlanejamentoTerapeuticoApiService,
    private prontuarioApi: ProntuarioApiService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profissionalId'] && this.profissionalId) {
      this.carregarProcedimentosPadrao(this.profissionalId);
    }
    if (changes['consultaId'] && this.consultaId) {
      this.carregarPlanejamentosExistentes();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get totalPlanejamento(): number {
    return this.planejamentos.reduce((sum, item) => sum + (item.valor || 0), 0);
  }

  private carregarProcedimentosPadrao(profissionalId: number): void {
    this.procedimentoPadraoApi.listarPorProfissional(profissionalId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lista) => this.procedimentosPadrao = lista,
        error: () => this.procedimentosPadrao = []
      });
  }

  private carregarPlanejamentosExistentes(): void {
    if (!this.consultaId) return;
    
    this.prontuarioApi.buscarProntuarioById(this.consultaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prontuario: Prontuario) => {
          if (prontuario?.planejamentos) {
            this.planejamentos = prontuario.planejamentos.map((p: PlanejamentoTerapeutico) => ({
              id: p.id,
              dataProcedimento: p.dataProcedimento || '',
              procedimentoRealizado: p.procedimentoRealizado || '',
              valor: p.valor || 0,
              statusAssinatura: p.statusAssinatura || 'PENDENTE',
              _local: false,
            }));
          }
        },
        error: () => {
          // Se não encontrar prontuário, mantém o array vazio para novos planejamentos
          this.planejamentos = [];
        }
      });
  }

  selecionarProcedimentoPadrao(event: any): void {
    const id = Number(event.target.value);
    const proc = this.procedimentosPadrao.find(p => p.id === id);
    if (proc) {
      const procedimentoExistente = this.planejamentos.find(p =>
        p.procedimentoRealizado === proc.nomeProcedimento && !p._local
      );

      if (procedimentoExistente) {
        this.errorHandler.showError('Este procedimento já está cadastrado no planejamento e não pode ser duplicado.');
        event.target.value = '';
        return;
      }

      this.novoPlanejamento.procedimentoRealizado = proc.nomeProcedimento;
      this.novoPlanejamento.valor = proc.valorPadrao || 0;
      this.editandoProcedimentoExistente = true;
      this.procedimentoOriginal = proc;
    } else {
      this.editandoProcedimentoExistente = false;
      this.procedimentoOriginal = null;
    }
  }

  limparSelecaoProcedimento(): void {
    this.novoPlanejamento = { procedimentoRealizado: '', valor: 0, dataProcedimento: '' };
    this.editandoProcedimentoExistente = false;
    this.procedimentoOriginal = null;

    const selectElement = document.querySelector('select.form-select') as HTMLSelectElement;
    if (selectElement) {
      selectElement.value = '';
    }
  }

  adicionarPlanejamento(): void {
    if (!this.novoPlanejamento.procedimentoRealizado.trim()) {
      this.errorHandler.showError('Informe o procedimento realizado');
      return;
    }
    const payload = {
      prontuarioId: null as any,
      consultaId: this.consultaId,
      pacienteId: this.pacienteId,
      dataProcedimento: this.novoPlanejamento.dataProcedimento || new Date().toISOString().split('T')[0],
      procedimentoRealizado: this.novoPlanejamento.procedimentoRealizado,
      valor: this.novoPlanejamento.valor
    };
    this.planejamentos.push({
      ...payload,
      statusAssinatura: 'PENDENTE',
      _local: true
    });
    this.novoPlanejamento = { procedimentoRealizado: '', valor: 0, dataProcedimento: '' };
    this.editandoProcedimentoExistente = false;
    this.procedimentoOriginal = null;
  }

  removerPlanejamento(index: number): void {
    const item = this.planejamentos[index];
    if (item.id && !item._local) {
      this.planejamentoApi.remover(item.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.planejamentos.splice(index, 1);
            this.errorHandler.showSuccessToast('Item removido');
          },
          error: () => this.errorHandler.showError('Erro ao remover item')
        });
    } else {
      this.planejamentos.splice(index, 1);
    }
  }

  criarProcedimentoPadrao(): void {
    if (!this.novoProcedimentoPadrao.nomeProcedimento.trim()) return;
    this.procedimentoPadraoApi.criar(this.profissionalId!, this.novoProcedimentoPadrao)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (criado) => {
          this.procedimentosPadrao.push(criado);
          this.novoProcedimentoPadrao = { nomeProcedimento: '', valorPadrao: 0 };
          this.mostrarFormProcedimento = false;
          this.errorHandler.showSuccessToast('Procedimento cadastrado');
        },
        error: () => this.errorHandler.showError('Erro ao cadastrar procedimento')
      });
  }

  /**
   * Preenche os planejamentos com dados existentes (modo edição).
   * @param dados Objeto com o array de planejamentos do prontuário
   */
  setDados(dados: { planejamentos?: PlanejamentoTerapeutico[] }): void {
    if (!dados?.planejamentos) return;
    this.planejamentos = dados.planejamentos.map(p => ({
      id: p.id,
      dataProcedimento: p.dataProcedimento || '',
      procedimentoRealizado: p.procedimentoRealizado || '',
      valor: p.valor || 0,
      statusAssinatura: p.statusAssinatura || 'PENDENTE',
      _local: false,
    }));
  }

  /**
   * Retorna os dados da aba para composição do payload de finalização.
   */
  getDados(): any {
    const today = new Date().toISOString().split('T')[0];
    return {
      planejamentos: this.planejamentos
        .map(p => ({
          dataProcedimento: p.dataProcedimento || today,
          procedimentoRealizado: p.procedimentoRealizado,
          valor: p.valor,
          pacienteId: this.pacienteId,
        })),
    };
  }
}
