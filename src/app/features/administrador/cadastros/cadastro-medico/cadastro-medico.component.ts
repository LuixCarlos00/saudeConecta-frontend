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
      nome: ['', Validators.required],
      sexo: ['', Validators.required],
      dataNascimento: ['', Validators.required],
      cpf: ['', [Validators.required, cpfValidator()]],
      rg: [''],
      registroConselho: ['', Validators.required],
      especialidade: ['', Validators.required],
      telefone: [''],
      email: ['', [Validators.required, Validators.email]],
      formacao: [''],
      instituicao: [''],
      tempoConsultaMinutos: [30],
      tipoProfissional: ['MEDICO', Validators.required]
    });

    this.FormularioEndereco = this.form.group({
      nacionalidade: [''],
      uf: ['', [Validators.required, Validators.maxLength(2)]],
      cep: ['', Validators.required],
      rua: ['', Validators.required],
      municipio: ['', Validators.required],
      bairro: ['', Validators.required],
      numero: ['', Validators.required],
      complemento: [''],
    });

    // Adicionar listener para formatar CPF
    this.FormularioMedico.get('cpf')?.valueChanges.subscribe(value => {
      if (value && value.length <= 14) {
        const formatted = CpfValidator.format(value);
        if (formatted !== value) {
          this.FormularioMedico.get('cpf')?.setValue(formatted, { emitEvent: false });
        }
      }
    });

    // Adicionar listener para validar no blur (quando sai do campo)
    this.FormularioMedico.get('cpf')?.valueChanges.subscribe(() => {
      // Força a validação quando o valor muda
      this.FormularioMedico.get('cpf')?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });

    // Adicionar listener para formatar e buscar CEP
    this.FormularioEndereco.get('cep')?.valueChanges.subscribe(value => {
      if (value && value.length <= 9) {
        const formatted = this.cepApiService.formatarCep(value);
        if (formatted !== value) {
          this.FormularioEndereco.get('cep')?.setValue(formatted, { emitEvent: false });
        }

        // Busca endereço quando CEP está completo
        if (this.cepApiService.limparCep(value).length === 8) {
          this.buscarEnderecoPorCep(this.cepApiService.limparCep(value));
        }
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

    if (error.status === 409 && error.error.includes && error.error.includes('CPF já cadastrado no sistema')) {
      errorMessage = 'CPF já cadastrado no sistema. Por favor, verifique os dados.';
    } else if (error.status === 409 && error.error.includes && error.error.includes('Email já cadastrado no sistema como')) {
      if (error.error.includes && error.error.includes('Email já cadastrado no sistema')) {
        errorMessage = 'Email já cadastrado no sistema. Por favor, utilize outro email.';
      } else if (error.error.includes && error.error.includes('Duplicate entry') && error.error.includes('medico.MedEmail_UNIQUE')) {
        errorMessage = 'Já existe um Médico registrado com esse email.';
      } else if (error.error.includes && error.error.includes('Duplicate entry') && error.error.includes('medico.MedCrm_UNIQUE')) {
        errorMessage = 'Já existe um Médico registrado com esse CRM.';
      } else {
        errorMessage = typeof error.error === 'string' ? error.error : 'Erro ao processar cadastro.';
      }
    }

    Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: errorMessage,
    });
  }

  ngOnDestroy(): void {
    if (this.usuarioSubscription) {
      this.usuarioSubscription.unsubscribe();
    }
  }
}
