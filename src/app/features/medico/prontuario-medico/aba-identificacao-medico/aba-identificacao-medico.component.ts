import { Component, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PacienteApiService } from 'src/app/services/api/paciente-api.service';

@Component({
  selector: 'app-aba-identificacao-medico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aba-identificacao-medico.component.html',
  styleUrl: '../prontuario-shared.scss',
  host: { style: 'display: block; width: 100%;' },
})
export class AbaIdentificacaoMedicoComponent implements OnChanges, OnDestroy {

  @Input() pacienteId: number | undefined;

  dadosPaciente: any = null;
  pacienteLoading = false;

  // Dados do prontuário
  responsavel = '';
  peso = '';
  altura = '';
  temperatura = '';
  saturacao = '';
  pressao = '';
  frequenciaRespiratoria = '';
  frequenciaArterialSistolica = '';
  frequenciaArterialDiastolica = '';
  hemoglobina = '';
  pulso = '';
  dataNascimento = '';
  queixaPrincipal = '';
  anamnese = '';
  observacao = '';
  diagnostico = '';
  modeloPrescricao = '';
  tituloPrescricao = '';
  dataPrescricao = '';
  prescricao = '';
  tempoDuracao = '';
  exameOutros = '';
  orientacoes = '';
  tussTexto = '';
  cidTexto = '';
  solicitacaoExameTexto = '';

  private readonly destroy$ = new Subject<void>();

  constructor(private pacienteApi: PacienteApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pacienteId'] && this.pacienteId) {
      this.carregarDadosPaciente(this.pacienteId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private carregarDadosPaciente(pacienteId: number): void {
    this.pacienteLoading = true;
    this.pacienteApi.buscarrPacientebyOrg(pacienteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (paciente) => {
          this.dadosPaciente = paciente;
          this.pacienteLoading = false;
        },
        error: () => { this.pacienteLoading = false; }
      });
  }

  /**
   * Retorna o sexo formatado para exibição.
   * @param valor Código do sexo (1 = Masculino, 2 = Feminino)
   * @returns Descrição legível do sexo
   */
  getSexoLabel(valor: string | null): string {
    if (!valor) return '-';
    if (valor === '1' || valor.toUpperCase() === 'M') return 'Masculino';
    if (valor === '2' || valor.toUpperCase() === 'F') return 'Feminino';
    return valor;
  }

  setDados(dados: any): void {
    if (!dados) return;
    this.responsavel = dados.responsavel || '';
  }

  getDados(): any {
    return {
      responsavel: this.responsavel,
    };
  }
}
