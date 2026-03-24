import { Component, Inject, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { ProntuarioApiService } from 'src/app/services/api/prontuario-api.service';
import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';
import { Consultav2 } from 'src/app/util/variados/interfaces/consulta/consultav2';

import { AbaIdentificacaoMedicoComponent } from '../aba-identificacao-medico/aba-identificacao-medico.component';
import { AbaExameObjetivoMedicoComponent } from '../aba-exame-objetivo-medico/aba-exame-objetivo-medico.component';
import { AbaCodigosTussCidMedicoComponent } from '../aba-codigos-tuss-cid-medico/aba-codigos-tuss-cid-medico.component';
import { AbaPlanejamentoMedicoComponent } from '../aba-planejamento-medico/aba-planejamento-medico.component';

@Component({
  selector: 'app-editar-prontuario-medico',
 
  templateUrl: './editar-prontuario-medico.component.html',
  styleUrl: './editar-prontuario-medico.component.scss',
})
export class EditarProntuarioMedicoComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild(AbaIdentificacaoMedicoComponent) abaIdentificacao!: AbaIdentificacaoMedicoComponent;
  @ViewChild(AbaExameObjetivoMedicoComponent) abaExameObjetivo!: AbaExameObjetivoMedicoComponent;
  @ViewChild(AbaCodigosTussCidMedicoComponent) abaCodigosTussCid!: AbaCodigosTussCidMedicoComponent;
  @ViewChild(AbaPlanejamentoMedicoComponent) abaPlanejamento!: AbaPlanejamentoMedicoComponent;

  selectedTabIndex = 0;
  carregando = true;
  salvando = false;
  erro = '';

  consulta: Consultav2;
  private prontuarioData: any = null;
  private prontuarioId: number | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<EditarProntuarioMedicoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { consulta: Consultav2 },
    private prontuarioApi: ProntuarioApiService,
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

    this.prontuarioApi.buscarProntuarioById(this.consulta.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prontuario) => {
          console.log('prontuario',prontuario);
          this.prontuarioData = prontuario;
          this.prontuarioId = prontuario.codigoProntuario || null;
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

   // Injeta pacienteId nos planejamentos (não disponível dentro da aba no modo edição)
   const planejamentosComPaciente = (dadosPlanejamento.planejamentos || []).map(
     (p: any) => ({ ...p, pacienteId: this.consulta.pacienteId })
   );

   const payload: any = {
     ...dadosIdentificacao,
     ...dadosExame,
     ...dadosCodigos,
     planejamentos: planejamentosComPaciente,
     codigoMedico: this.consulta.profissionalId,
     consulta: this.consulta.id,
     dataFinalizado: new Date().toISOString().split('T')[0],
   };

   this.prontuarioApi.atualizarProntuarioMedico(this.prontuarioId!, payload)
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
