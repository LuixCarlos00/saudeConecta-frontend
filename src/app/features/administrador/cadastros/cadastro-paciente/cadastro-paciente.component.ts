import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { ufOptions } from 'src/app/util/variados/options/options';
import { PacienteApiService } from 'src/app/services/api/paciente-api.service';
import { FiltroStateService } from 'src/app/services/state/filtro-state.service';
import { CepApiService } from 'src/app/services/api/cep-api.service';
import { cpfValidator } from 'src/app/util/validators/cpf-form.validator';
import { CpfValidator } from 'src/app/util/validators/cpf.validator';

@Component({
  selector: 'app-cadastro-paciente',
  templateUrl: './cadastro-paciente.component.html',
  styleUrl: './cadastro-paciente.component.css',
})
export class CadastroPacienteComponent implements OnInit, OnDestroy {

  private subscription: Subscription | undefined;
  FormularioPaciente!: FormGroup;
  FormularioEndereco!: FormGroup;
  ufOptions = ufOptions;
  isLoading = false;

  constructor(
    private form: FormBuilder,
    private route: Router,
    private pacienteApi: PacienteApiService,
    private filtroStateService: FiltroStateService,
    private cepApiService: CepApiService
  ) { }

  ngOnInit(): void {
    this.FormularioPaciente = this.form.group({
      nome: ['', Validators.required],
      sexo: ['', Validators.required],
      dataNascimento: ['', Validators.required],
      cpf: ['', [Validators.required, cpfValidator()]],
      rg: [''],
      telefone: [''],
      email: ['', [Validators.required, Validators.email]],
    });

    this.FormularioEndereco = this.form.group({
      nacionalidade: [''],
      uf: ['', Validators.maxLength(2)],
      cep: ['', Validators.required],
      rua: ['', Validators.required],
      municipio: ['', Validators.required],
      bairro: ['', Validators.required],
      numero: ['', Validators.required],
      complemento: [''],
    });

    // Adicionar listener para formatar CPF
    this.FormularioPaciente.get('cpf')?.valueChanges.subscribe(value => {
      if (value && value.length <= 14) {
        const formatted = CpfValidator.format(value);
        if (formatted !== value) {
          this.FormularioPaciente.get('cpf')?.setValue(formatted, { emitEvent: false });
        }
      }
    });

    // Adicionar listener para validar no blur (quando sai do campo)
    this.FormularioPaciente.get('cpf')?.valueChanges.subscribe(() => {
      // Força a validação quando o valor muda
      this.FormularioPaciente.get('cpf')?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
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
  }

  validateCpfOnBlur() {
    const cpfControl = this.FormularioPaciente.get('cpf');
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

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }




  cadastra() {
    if (!this.FormularioEndereco.valid || !this.FormularioPaciente.valid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulário incompleto',
        text: 'Por favor, preencha todos os campos obrigatórios, incluindo o CPF.',
      });
      return;
    }

    const paci = this.FormularioPaciente.value;

    if (!paci.cpf || paci.cpf.length < 11) {
      Swal.fire({
        icon: 'warning',
        title: 'CPF inválido',
        text: 'O CPF é obrigatório e deve ser válido.',
      });
      return;
    }

    this.isLoading = true;

    // Preparar payload com limpeza de dados
    const dadosCompletos = this.prepararPayload();

    console.log('Dados completos para cadastro:', dadosCompletos);

    this.pacienteApi.cadastrarPacientebyOrg(dadosCompletos).subscribe({
      next: () => {
        this.isLoading = false;
        Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Paciente cadastrado com sucesso.',
        }).then(() => {
          this.FormularioPaciente.reset();
          this.FormularioEndereco.reset();
          this.filtroStateService.setRecarregar(true);
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.handleHttpError(error);
      }
    });
  }

  /**
   * Prepara o payload limpando e formatando os dados antes do envio
   */
  private prepararPayload() {
    const paciente = this.FormularioPaciente.value;
    const endereco = this.FormularioEndereco.value;

    return {
      // Dados do paciente
      nome: paciente.nome?.trim() || null,
      sexo: paciente.sexo || null,
      dataNacimento: paciente.dataNascimento || null,
      cpf: this.limparCpf(paciente.cpf),
      rg: paciente.rg?.trim() || null,
      email: paciente.email?.trim() || null,
      telefone: this.limparTelefone(paciente.telefone),

      // Dados do endereço
      nacionalidade: endereco.nacionalidade?.trim() || null,
      uf: endereco.uf?.trim() || null,
      municipio: endereco.municipio?.trim() || null,
      bairro: endereco.bairro?.trim() || null,
      cep: this.cepApiService.limparCep(endereco.cep),
      rua: endereco.rua?.trim() || null,
      numero: endereco.numero || null,
      complemento: endereco.complemento?.trim() || null
    };
  }

  /**
   * Remove formatação do CPF (pontos e hífen)
   */
  private limparCpf(cpf: string): string | null {
    if (!cpf) return null;
    return cpf.replace(/[.\-]/g, '');
  }

  /**
   * Remove formatação do telefone
   */
  private limparTelefone(telefone: string): string | null {
    if (!telefone) return null;
    return telefone.replace(/[\s\-()]/g, '');
  }

  private handleHttpError(error: any) {
    let errorMessage = 'Erro desconhecido ao realizar o cadastro.';

    if (error.error) {
      if (error.error.includes && error.error.includes('Duplicate entry') && error.error.includes('paciente.PaciEmail_UNIQUE')) {
        errorMessage = 'Já existe um paciente registrado com esse email.';
      } else if (error.error.includes && error.error.includes('Duplicate entry') && error.error.includes('paciente.PaciCpf_UNIQUE')) {
        errorMessage = 'Já existe um paciente registrado com esse CPF.';
      } else if (error.error.includes && error.error.includes('Duplicate entry') && error.error.includes('paciente.PaciRg_UNIQUE')) {
        errorMessage = 'Já existe um paciente registrado com esse RG.';
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
}
