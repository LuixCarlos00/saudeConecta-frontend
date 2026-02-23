import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, firstValueFrom, takeUntil, map, startWith } from 'rxjs';
import Swal from 'sweetalert2';

import { ProntuarioApiService } from 'src/app/services/api/prontuario-api.service';
import { ProntuarioStateService } from 'src/app/services/state/prontuario-state.service';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';

import { Prontuario } from 'src/app/util/variados/interfaces/Prontuario/Prontuario';
import { Cid_codigo_internaciona_doecas } from 'src/app/util/variados/options/cid-codigo-internaciona-doecas';
import { Tuss_terminologia_Unificada_Saude_Suplementar } from 'src/app/util/variados/options/tuss-Terminologia-unificada-saude-splementar';
import { Consultav2 } from "../../../util/variados/interfaces/consulta/consultav2";

@Component({
  selector: 'app-prontuario-medico',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './prontuario-medico.component.html',
  styleUrl: './prontuario-medico.component.scss'
})
export class ProntuarioMedicoComponent implements OnInit, OnDestroy {

  selectedTabIndex = 0;
  timer = 0;
  minutes = 0;
  seconds = 0;
  interval: ReturnType<typeof setInterval> | null = null;
  Consulta: Consultav2 = {} as Consultav2;
  Prontuario!: Prontuario;
  FinalizarConsulta = false;

  QueixaPrincipal: string = '';
  peso: string = '';
  altura: string = '';
  Temperatura: string = '';
  DataNacimento: string = '';
  Sexo: string = '';
  Saturacao: string = '';
  Hemoglobinacao: string = '';
  FreqRespiratoria: string = '';
  PressArterial: string = '';
  FreqArterialSistolica: string = '';
  FreqArterialDiastolica: string = '';
  observacao: string = '';
  Conduta: any;
  Anamnese: any;

  myControlCid = new FormControl('');
  optionsCid: { codigo: string; label: string }[] = Cid_codigo_internaciona_doecas;
  filteredOptionsCid: { codigo: string; label: string }[] = [];
  selectedOptionsCid: { codigo: string; label: string }[] = [];
  primeiraColunaCid: { codigo: string; label: string }[] = [];
  segundaColunaCid: { codigo: string; label: string }[] = [];
  pageSizeCid = 20;
  currentPageCid = 1;
  totalPagesCid = 1;

  PrescricaoText: string = '';
  DataPrescricao: string = '';
  ModeloPrescricao: string = '';
  TituloPrescricao: string = '';
  ModeloExame: string = '';
  TituloExame: string = '';
  DataExame: string = '';
  ExameText: string = '';

  myControlTuss = new FormControl('');
  optionsTuss: { codigo: string; descricao: string; fabricante: string; tabela: number }[] = Tuss_terminologia_Unificada_Saude_Suplementar;
  filteredOptionsTuss: { codigo: string; descricao: string; fabricante: string; tabela: number }[] = [];
  selectedOptionsTuss: { codigo: string; descricao: string; fabricante: string; tabela: number }[] = [];
  primeiraColunaTuss: { codigo: string; descricao: string; fabricante: string; tabela: number }[] = [];
  segundaColunaTuss: { codigo: string; descricao: string; fabricante: string; tabela: number }[] = [];
  pageSizeTuss = 20;
  currentPageTuss = 1;
  totalPagesTuss = 1;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private prontuarioApi: ProntuarioApiService,
    private prontuarioState: ProntuarioStateService,
    private errorHandler: ErrorHandlerService
  ) { }

  ngOnInit(): void {
    this.startTimer();
    this.resetTimer();
    this.prontuarioState.consulta$
      .pipe(takeUntil(this.destroy$))
      .subscribe((consulta) => {
        this.Consulta = consulta;
        console.log(this.Consulta);
      });

    this.filtrandoDadosCid();
    this.filtrandoDadosTuss();
  }

  finalizar() {
    this.FinalizarConsulta = true;
    Swal.fire({
      icon: 'warning',
      title: 'Atenção',
      text: 'Deseja finalizar a consulta?',
      showCancelButton: true,
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não',
    }).then((result) => {
      if (result.isConfirmed) {
        this.concluido();
      } else {
        this.FinalizarConsulta = false;
        Swal.fire({
          icon: 'success',
          title: 'Retomando consulta',
          showConfirmButton: false,
          timer: 1500,
        });
      }
    });
  }

  concluido() {
    console.log(this.Consulta);
    this.Prontuario = {} as any;

    this.Prontuario.altura = this.altura;
    this.Prontuario.peso = this.peso;
    this.Prontuario.temperatura = this.Temperatura;
    this.Prontuario.sexo = this.Sexo;
    this.Prontuario.saturacao = this.Saturacao;
    this.Prontuario.hemoglobina = this.Hemoglobinacao;
    this.Prontuario.frequenciaRespiratoria = this.FreqRespiratoria;
    this.Prontuario.pressao = this.PressArterial;
    this.Prontuario.frequenciaArterialSistolica = this.FreqArterialSistolica;
    this.Prontuario.frequenciaArterialDiastolica = this.FreqArterialDiastolica;
    this.Prontuario.observacao = this.observacao;
    this.Prontuario.conduta = this.Conduta;
    this.Prontuario.anamnese = this.Anamnese;
    this.Prontuario.queixaPrincipal = this.QueixaPrincipal;

    const prontDiagnostico = this.selectedOptionsCid.map((option) => option.label).join(', ');
    this.Prontuario.diagnostico = prontDiagnostico;

    this.Prontuario.prescricao = this.PrescricaoText;
    this.Prontuario.dataPrescricao = new Date().toISOString().split('T')[0];
    this.Prontuario.modeloPrescricao = this.ModeloPrescricao;
    this.Prontuario.tituloExame = this.TituloPrescricao;
    this.Prontuario.exame = this.ExameText;
    this.Prontuario.dataExame = new Date().toISOString().split('T')[0];
    this.Prontuario.modeloExame = this.ModeloExame;
    this.Prontuario.tituloExame = this.TituloExame;


    this.Prontuario.dataFinalizado = new Date().toISOString().split('T')[0];
    this.Prontuario.tempoDuracao = this.minutes + ':' + this.seconds;


    // Enviar IDs como Long (número puro), não como objeto
    (this.Prontuario as any).codigoMedico = this.Consulta.profissionalId;
    (this.Prontuario as any).consulta = this.Consulta.id;

    // Remover os objetos nested que estavam causando o erro
    delete (this.Prontuario as any).profissional;

    this.finalizarProntuario();
  }

  finalizarProntuario(): void {
    console.log('Dados do prontuário a serem salvos:', this.Prontuario);

    this.prontuarioApi.cadastrarProntuarioMedico(this.Prontuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.errorHandler.showSuccessToast('Prontuário finalizado com sucesso');
          this.stopTimer();
          setTimeout(() => {
            this.router.navigate(['/Agenda-Medico']);
          }, 1500);
        },
        error: (error) => {
          console.error('Erro ao cadastrar prontuário:', error);
          this.errorHandler.showError('Erro ao salvar prontuário');
          this.FinalizarConsulta = false;
        }
      });
  }

  filtrandoDadosCid() {
    this.filteredOptionsCid = this.optionsCid;
    this.totalPagesCid = Math.ceil(this.filteredOptionsCid.length / this.pageSizeCid);
    this.updatePaginatedOptionsCid();

    this.myControlCid.valueChanges
      .pipe(
        startWith(''),
        map((value) => this._filterCid(value || ''))
      )
      .subscribe((filteredData) => {
        this.filteredOptionsCid = filteredData;
        this.totalPagesCid = Math.ceil(this.filteredOptionsCid.length / this.pageSizeCid);
        this.currentPageCid = 1;
        this.updatePaginatedOptionsCid();
      });
  }

  private _filterCid(value: string): { codigo: string; label: string }[] {
    if (!value.trim()) {
      return this.optionsCid;
    }
    const filterValue = value.toLowerCase();
    return this.optionsCid.filter((option) =>
      option.label.toLowerCase().includes(filterValue)
    );
  }

  private updatePaginatedOptionsCid() {
    const startIndex = (this.currentPageCid - 1) * this.pageSizeCid;
    const endIndex = startIndex + this.pageSizeCid;
    const currentOptions = this.filteredOptionsCid.slice(startIndex, endIndex);

    const primeiraColunaLength = Math.min(10, currentOptions.length);
    this.primeiraColunaCid = currentOptions.slice(0, primeiraColunaLength);
    this.segundaColunaCid = currentOptions.slice(primeiraColunaLength);
  }

  goToPageCid(page: number) {
    if (page >= 1 && page <= this.totalPagesCid) {
      this.currentPageCid = page;
      this.updatePaginatedOptionsCid();
    }
  }

  selectOptionCid(option: { codigo: string; label: string }) {
    const index = this.selectedOptionsCid.findIndex(o => o.codigo === option.codigo);
    if (index > -1) {
      this.selectedOptionsCid.splice(index, 1);
    } else {
      this.selectedOptionsCid.push(option);
    }
  }

  isSelectedCid(option: { codigo: string; label: string }): boolean {
    return this.selectedOptionsCid.some(o => o.codigo === option.codigo);
  }

  resetarPesquisaCid() {
    this.filtrandoDadosCid();
    this.myControlCid.setValue('');
  }

  limparPesquisaCid() {
    this.myControlCid.setValue('');
    this.onSearchChangeCid();
  }

  onSearchChangeCid() {
    const value = this.myControlCid.value || '';
    this.filteredOptionsCid = this._filterCid(value);
    this.totalPagesCid = Math.ceil(this.filteredOptionsCid.length / this.pageSizeCid);
    this.currentPageCid = 1;
    this.updatePaginatedOptionsCid();
  }

  filtrandoDadosTuss() {
    this.filteredOptionsTuss = this.optionsTuss;
    this.totalPagesTuss = Math.ceil(this.filteredOptionsTuss.length / this.pageSizeTuss);
    this.updatePaginatedOptionsTuss();

    this.myControlTuss.valueChanges
      .pipe(
        startWith(''),
        map((value) => this._filterTuss(value || ''))
      )
      .subscribe((filteredData) => {
        this.filteredOptionsTuss = filteredData;
        this.totalPagesTuss = Math.ceil(this.filteredOptionsTuss.length / this.pageSizeTuss);
        this.currentPageTuss = 1;
        this.updatePaginatedOptionsTuss();
      });
  }

  private _filterTuss(value: string): { codigo: string; descricao: string; fabricante: string; tabela: number }[] {
    if (!value.trim()) {
      return this.optionsTuss;
    }
    const filterValue = value.toLowerCase();
    return this.optionsTuss.filter((option) =>
      option.descricao.toLowerCase().includes(filterValue)
    );
  }

  private updatePaginatedOptionsTuss() {
    const startIndex = (this.currentPageTuss - 1) * this.pageSizeTuss;
    const endIndex = startIndex + this.pageSizeTuss;
    const currentOptions = this.filteredOptionsTuss.slice(startIndex, endIndex);

    const primeiraColunaLength = Math.min(10, currentOptions.length);
    this.primeiraColunaTuss = currentOptions.slice(0, primeiraColunaLength);
    this.segundaColunaTuss = currentOptions.slice(primeiraColunaLength);
  }

  goToPageTuss(page: number) {
    if (page >= 1 && page <= this.totalPagesTuss) {
      this.currentPageTuss = page;
      this.updatePaginatedOptionsTuss();
    }
  }

  selectOptionTuss(option: { codigo: string; descricao: string; fabricante: string; tabela: number }) {
    const index = this.selectedOptionsTuss.findIndex(o => o.codigo === option.codigo);
    if (index > -1) {
      this.selectedOptionsTuss.splice(index, 1);
    } else {
      this.selectedOptionsTuss.push(option);
    }
    this.updatePrescricaoText();
  }

  isSelectedTuss(option: { codigo: string; descricao: string; fabricante: string; tabela: number }): boolean {
    return this.selectedOptionsTuss.some(o => o.codigo === option.codigo);
  }

  updatePrescricaoText() {
    this.PrescricaoText = this.selectedOptionsTuss.map((option) => option.descricao).join('\n');
  }

  resetarPesquisaTuss() {
    this.filtrandoDadosTuss();
    this.myControlTuss.setValue('');
  }

  limparPesquisaTuss() {
    this.myControlTuss.setValue('');
    this.onSearchChangeTuss();
  }

  onSearchChangeTuss() {
    const value = this.myControlTuss.value || '';
    this.filteredOptionsTuss = this._filterTuss(value);
    this.totalPagesTuss = Math.ceil(this.filteredOptionsTuss.length / this.pageSizeTuss);
    this.currentPageTuss = 1;
    this.updatePaginatedOptionsTuss();
  }

  resetTimer() {
    this.timer = 0;
    this.minutes = 0;
    this.seconds = 0;
  }

  stopTimer() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  startTimer() {
    this.interval = setInterval(() => {
      this.timer++;
      this.minutes = Math.floor(this.timer / 60);
      this.seconds = this.timer % 60;
    }, 1000);
  }

  clearTimer() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  onMudarAba(index: number) {
    if (index === 6) {
      this.pausarTempo();
    }
    this.selectedTabIndex = index;
  }

  pausarTempo() {
    this.stopTimer();
  }

  ngOnDestroy(): void {
    this.stopTimer();

    // Limpar estado da consulta ao sair do componente
    // Isso garante que não seja possível acessar o prontuário diretamente pela URL
    this.prontuarioState.limpar();

    this.destroy$.next();
    this.destroy$.complete();
  }
}
