import { Component, Inject, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { ProntuarioDentistaApiService } from 'src/app/services/api/prontuario-dentista-api.service';
import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';
import { Consultav2 } from 'src/app/util/variados/interfaces/consulta/consultav2';

import { AbaIdentificacaoComponent } from '../aba-identificacao/aba-identificacao.component';
import { AbaExameObjetivoComponent } from '../aba-exame-objetivo/aba-exame-objetivo.component';
import { AbaCodigosTussCidComponent } from '../aba-codigos-tuss-cid/aba-codigos-tuss-cid.component';
import { AbaPlanejamentoComponent } from '../aba-planejamento/aba-planejamento.component';

@Component({
  selector: 'app-editar-prontuario-dentista',
 
  templateUrl: './editar-prontuario-dentista.component.html',
  styleUrl: './editar-prontuario-dentista.component.scss',
})
export class EditarProntuarioDentistaComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild(AbaIdentificacaoComponent) abaIdentificacao!: AbaIdentificacaoComponent;
  @ViewChild(AbaExameObjetivoComponent) abaExameObjetivo!: AbaExameObjetivoComponent;
  @ViewChild(AbaCodigosTussCidComponent) abaCodigosTussCid!: AbaCodigosTussCidComponent;
  @ViewChild(AbaPlanejamentoComponent) abaPlanejamento!: AbaPlanejamentoComponent;

  selectedTabIndex = 0;
  carregando = true;
  salvando = false;
  erro = '';

  consulta: Consultav2;
  private prontuarioData: any = null;
  private prontuarioId: number | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<EditarProntuarioDentistaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { consulta: Consultav2 },
    private prontuarioDentistaApi: ProntuarioDentistaApiService,
    private errorHandler: ErrorHandlerService
  ) {
    this.consulta = data.consulta;
  }

  ngOnInit(): void {
    this.carregarProntuario();
  }

  ngAfterViewInit(): void {
    // Se os dados já foram carregados antes do ViewChild estar pronto
    if (this.prontuarioData && !this.carregando) {
      this.preencherAbas();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carrega o prontuário mais recente da consulta via API.
   */
  private carregarProntuario(): void {
    this.carregando = true;
    this.erro = '';

    this.prontuarioDentistaApi.buscarProntuarioDentistaById(this.consulta.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prontuario) => {
            console.log(prontuario);
          this.prontuarioData = prontuario;
          this.prontuarioId = prontuario.codigo;
          this.carregando = false;

          // Usar setTimeout para garantir que os ViewChild estejam disponíveis
          setTimeout(() => this.preencherAbas(), 0);
        },
        error: (err) => {
          console.error('Erro ao carregar prontuário:', err);
          this.erro = 'Não foi possível carregar o prontuário desta consulta.';
          this.carregando = false;
        }
      });
  }

  /**
   * Preenche os sub-componentes com os dados do prontuário carregado.
   */
  private preencherAbas(): void {
    if (!this.prontuarioData) return;

    this.abaIdentificacao?.setDados(this.prontuarioData);
    this.abaExameObjetivo?.setDados(this.prontuarioData);
    this.abaCodigosTussCid?.setDados(this.prontuarioData);
    this.abaPlanejamento?.setDados(this.prontuarioData);
  }

  /**
   * Coleta dados dos sub-componentes e envia atualização para o backend.
   */
  salvar(): void {
    if (!this.prontuarioId) {
      this.errorHandler.showError('ID do prontuário não encontrado');
      return;
    }

    Swal.fire({
      icon: 'question',
      title: 'Confirmar edição',
      text: 'Deseja salvar as alterações no prontuário?',
      showCancelButton: true,
      confirmButtonText: 'Sim, salvar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
    }).then(result => {
      if (result.isConfirmed) {
        this.executarSalvamento();
      }
    });
  }

  /**
   * Executa o salvamento do prontuário no backend.
   */
  private executarSalvamento(): void {
    this.salvando = true;

    const dadosIdentificacao = this.abaIdentificacao?.getDados() || {};
    const dadosExame = this.abaExameObjetivo?.getDados() || {};
    const dadosCodigos = this.abaCodigosTussCid?.getDados() || {};
    const dadosPlanejamento = this.abaPlanejamento?.getDados() || {};

    const payload: any = {
      ...dadosIdentificacao,
      ...dadosExame,
      ...dadosCodigos,
      ...dadosPlanejamento,
      codigoMedico: this.consulta.profissionalId,
      consulta: this.consulta.id,
    };

    this.prontuarioDentistaApi.atualizarProntuario(this.prontuarioId!, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.salvando = false;
          this.errorHandler.showSuccessToast('Prontuário atualizado com sucesso');
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Erro ao atualizar prontuário:', err);
          this.errorHandler.showError('Erro ao salvar alterações do prontuário');
          this.salvando = false;
        }
      });
  }

  /**
   * Fecha o dialog sem salvar.
   */
  fechar(): void {
    this.dialogRef.close(false);
  }
}
