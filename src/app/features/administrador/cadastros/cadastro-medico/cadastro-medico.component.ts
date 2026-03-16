import { Component, OnInit, OnDestroy, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';

import { ProfissionalApiService } from 'src/app/services/api/profissional-api.service';
import { ufOptions } from 'src/app/util/variados/options/options';
import { FiltroStateService } from 'src/app/services/state/filtro-state.service';
import { CepApiService } from 'src/app/services/api/cep-api.service';
import { cpfValidator } from 'src/app/util/validators/cpf-form.validator';
import { CpfValidator } from 'src/app/util/validators/cpf.validator';
import { logradouro } from 'src/app/util/variados/interfaces/endereco/logradouro';
import { EspecialidadeApiService, EspecialidadeResponse } from 'src/app/services/api/especialidade-api.service';
import { getFieldError } from 'src/app/util/validators/field-errors';
import {
  nomeCompletoValidator,
  dataNascimentoValidator,
  rgValidator,
  registroConselhoValidator,
  telefoneValidator,
  emailValidator,
  cepValidator,
  textoBrValidator,
  nacionalidadeValidator,
  numeroEnderecoValidator,
  tempoConsultaValidator,
  formacaoValidator,
} from 'src/app/util/validators/form-validators';


@Component({
  selector: 'app-cadastro-medico',
  templateUrl: './cadastro-medico.component.html',
  styleUrls: ['./cadastro-medico.component.css'],
})
export class CadastroMedicoComponent implements OnInit, OnDestroy {

  private usuarioSubscription: Subscription | undefined;
  FormularioMedico!: FormGroup;
  FormularioEndereco!: FormGroup;
  especialidades: EspecialidadeResponse[] = [];
  ufOptions = ufOptions;
  isLoading = false;
  isLoadingEspecialidades = false;
  mostrarModalNovaEspecialidade = false;
  novaEspecialidadeNome = '';
  getFieldError = getFieldError;


  logradouro: logradouro = {
    codigo: 0,
    nacionalidade: '',
    uf: '',
    municipio: '',
    bairro: '',
    cep: '',
    rua: '',
    numero: 0,
    complemento: 0,
  };

  constructor(
    private form: FormBuilder,
    private profissionalApiService: ProfissionalApiService,
    private route: Router,
    @Optional() private dialogRef: MatDialogRef<CadastroMedicoComponent>,
    private filtroStateService: FiltroStateService,
    private cepApiService: CepApiService,
    private especialidadeService: EspecialidadeApiService
  ) { }


  ngOnInit(): void {
    this.FormularioMedico = this.form.group({
      nome: ['', [Validators.required, nomeCompletoValidator()]],
      sexo: ['', Validators.required],
      dataNascimento: ['', [Validators.required, dataNascimentoValidator(18, 100)]],
      cpf: ['', [Validators.required, cpfValidator()]],
      rg: ['', rgValidator()],
      registroConselho: ['', [Validators.required, registroConselhoValidator()]],
      especialidade: ['', Validators.required],
      telefone: ['', telefoneValidator()],
      email: ['', [Validators.required, emailValidator()]],
      formacao: ['', formacaoValidator()],
      instituicao: ['', formacaoValidator()],       // mesma lógica
      tempoConsultaMinutos: [30, tempoConsultaValidator()],
      tipoProfissional: ['MEDICO', Validators.required],
    });



    // Formatar CPF ao digitar
    this.FormularioMedico.get('cpf')?.valueChanges.subscribe(value => {
      if (value && value.length <= 14) {
        const formatted = CpfValidator.format(value);
        if (formatted !== value) {
          this.FormularioMedico.get('cpf')?.setValue(formatted, { emitEvent: false });
        }
      }
      this.FormularioMedico.get('cpf')?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });

    // Quando tipoProfissional muda, revalida o registroConselho (CRM ↔ CRO)
    this.FormularioMedico.get('tipoProfissional')?.valueChanges.subscribe(() => {
      this.FormularioMedico.get('registroConselho')?.updateValueAndValidity();
    });

    // Formatar e buscar CEP
    this.FormularioEndereco.get('cep')?.valueChanges.subscribe(value => {
      if (value && value.length <= 9) {
        const formatted = this.cepApiService.formatarCep(value);
        if (formatted !== value) {
          this.FormularioEndereco.get('cep')?.setValue(formatted, { emitEvent: false });
        }
        if (this.cepApiService.limparCep(value).length === 8) {
          this.buscarEnderecoPorCep(this.cepApiService.limparCep(value));
        }
      }
    });

    // Formatar telefone ao digitar: (00) 00000-0000
    this.FormularioMedico.get('telefone')?.valueChanges.subscribe(value => {
      if (!value) return;
      const digits = value.replace(/\D/g, '').slice(0, 11);
      let formatted = digits;
      if (digits.length >= 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      if (digits.length >= 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
      if (formatted !== value) {
        this.FormularioMedico.get('telefone')?.setValue(formatted, { emitEvent: false });
      }
    });

    this.carregarEspecialidades();
  }


  validateCpfOnBlur() {
    const cpfControl = this.FormularioMedico.get('cpf');
    if (cpfControl) {
      // Marca o campo como 'touched' para mostrar erros
      cpfControl.markAsTouched();
      // Força a validação
      cpfControl.updateValueAndValidity();
    }
  }

  /**
   * Busca endereço pelo CEP e preenche os campos do formulário
   * @param cep CEP para busca (apenas números)
   */
  buscarEnderecoPorCep(cep: string) {
    this.cepApiService.buscarEnderecoPorCep(cep).subscribe({
      next: (endereco) => {
        // Preenche os campos do formulário com os dados do endereço
        this.FormularioEndereco.patchValue({
          rua: endereco.logradouro,
          bairro: endereco.bairro,
          municipio: endereco.localidade,
          uf: endereco.uf,
          complemento: endereco.complemento
        });

        // Mostra feedback visual de sucesso
        this.mostrarFeedbackCep('success', 'Endereço encontrado!');
      },
      error: (error) => {
        console.error('Erro ao buscar CEP:', error);
        this.mostrarFeedbackCep('error', 'CEP não encontrado. Preencha o endereço manualmente.');
      }
    });
  }

  /**
   * Mostra feedback visual sobre a busca de CEP
   * @param tipo Tipo do feedback (success/error)
   * @param mensagem Mensagem a ser exibida
   */
  private mostrarFeedbackCep(tipo: 'success' | 'error', mensagem: string) {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    Toast.fire({
      icon: tipo,
      title: mensagem
    });
  }

  private getTipoProfissionalSelecionado(): string {
    return this.FormularioMedico.get('tipoProfissional')?.value || 'MEDICO';
  }

  carregarEspecialidades() {
    this.isLoadingEspecialidades = true;
    this.especialidadeService.carregarEspecialidades().subscribe({
      next: (especialidades) => {
        this.especialidades = especialidades;
        this.isLoadingEspecialidades = false;
      },
      error: (error) => {
        console.error('Erro ao carregar especialidades:', error);
        this.isLoadingEspecialidades = false;
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível carregar as especialidades. Tente novamente.',
        });
      }
    });
  }

  abrirModalNovaEspecialidade() {
    this.mostrarModalNovaEspecialidade = true;
    this.novaEspecialidadeNome = '';
  }

  fecharModalNovaEspecialidade() {
    this.mostrarModalNovaEspecialidade = false;
    this.novaEspecialidadeNome = '';
  }

  criarNovaEspecialidade() {
    if (!this.novaEspecialidadeNome || this.novaEspecialidadeNome.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Campo obrigatório',
        text: 'Por favor, informe o nome da especialidade.',
      });
      return;
    }

    this.isLoading = true;
    const request = {
      tipoProfissionalId: 1,
      nome: this.novaEspecialidadeNome.trim(),
      codigo: this.novaEspecialidadeNome.trim().toUpperCase().replace(/\s+/g, '_')
    };

    this.especialidadeService.criar(request).subscribe({
      next: (novaEspecialidade) => {
        this.isLoading = false;
        this.especialidades.push(novaEspecialidade);
        this.FormularioMedico.patchValue({ especialidade: novaEspecialidade.nome });
        this.fecharModalNovaEspecialidade();

        Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Especialidade criada com sucesso.',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erro ao criar especialidade:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível criar a especialidade. Verifique se já existe uma especialidade com este nome.',
        });
      }
    });
  }

  cadastra() {
    if (!this.FormularioEndereco.valid || !this.FormularioMedico.valid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulário incompleto',
        text: 'Por favor, preencha todos os campos obrigatórios, incluindo o CPF.',
      });
      return;
    }

    const dadosCompletos = {
      ...this.FormularioMedico.value,
      ...this.FormularioEndereco.value,
      tipoProfissional: this.getTipoProfissionalSelecionado()
    };

    if (!dadosCompletos.cpf || dadosCompletos.cpf.length < 11) {
      Swal.fire({
        icon: 'warning',
        title: 'CPF inválido',
        text: 'O CPF é obrigatório e será usado como login do usuário.',
      });
      return;
    }

    this.isLoading = true;
    console.log(dadosCompletos);
    this.profissionalApiService.cadastraClinicoByOrg(dadosCompletos).subscribe({
      next: () => {
        this.isLoading = false;
        Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Médico cadastrado com sucesso. As credenciais serão enviadas por email.',
        }).then(() => {
          if (this.dialogRef) {
            this.dialogRef.close(true);
            // Emite evento de recarga para atualizar a tabela
            this.filtroStateService.setRecarregar(true);
          }
        });
      },
      error: (error) => {

        this.isLoading = false;
        this.handleHttpError(error);
      }
    });
  }

  private handleHttpError(error: any) {
    console.error('Erro HTTP:', error);
    let errorMessage = 'Erro desconhecido ao realizar o cadastro.';
    let titulo = 'Erro';
    let icone: 'error' | 'warning' = 'error';

    if (error.status === 422 && error.error?.message) {
      icone = 'warning';
      titulo = 'Limite do plano atingido';
      errorMessage = error.error.message;
    } else if (error.status === 409 && error.error?.includes && error.error.includes('CPF já cadastrado no sistema')) {
      errorMessage = 'CPF já cadastrado no sistema. Por favor, verifique os dados.';
    } else if (error.status === 409 && error.error?.includes && error.error.includes('Email já cadastrado no sistema como')) {
      if (error.error.includes('Email já cadastrado no sistema')) {
        errorMessage = 'Email já cadastrado no sistema. Por favor, utilize outro email.';
      } else if (error.error.includes('Duplicate entry') && error.error.includes('medico.MedEmail_UNIQUE')) {
        errorMessage = 'Já existe um Médico registrado com esse email.';
      } else if (error.error.includes('Duplicate entry') && error.error.includes('medico.MedCrm_UNIQUE')) {
        errorMessage = 'Já existe um Médico registrado com esse CRM.';
      } else {
        errorMessage = typeof error.error === 'string' ? error.error : 'Erro ao processar cadastro.';
      }
    }

    Swal.fire({
      icon: icone,
      title: titulo,
      text: errorMessage,
    });
  }

  ngOnDestroy(): void {
    if (this.usuarioSubscription) {
      this.usuarioSubscription.unsubscribe();
    }
  }
}
