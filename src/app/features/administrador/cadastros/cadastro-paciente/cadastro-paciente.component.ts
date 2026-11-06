import { Component, OnInit, OnDestroy, Optional, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { ufOptions } from 'src/app/shared/constants/options';
import { PacienteApiService } from 'src/app/core/data-access/paciente-api.service';
import { FiltroStateService } from 'src/app/core/data-access/filtro-state.service';
import { CepApiService } from 'src/app/core/data-access/cep-api.service';
import { cpfValidator } from 'src/app/shared/validators/cpf-form.validator';
import { CpfValidator } from 'src/app/shared/validators/cpf.validator';
import { getFieldError } from 'src/app/shared/validators/field-errors';
import {
  nomeCompletoValidator,
  dataNascimentoPacienteValidator,
  rgValidator,
  telefoneValidator,
  emailValidator,
  cepValidator,
  textoBrValidator,
  nacionalidadeValidator,
  numeroEnderecoValidator,
  antiInjectionValidator,
} from 'src/app/shared/validators/form-validators';
import { extrairMensagemErro } from '../../../../shared/utils/mensagem-erro-http';

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
  getFieldError = getFieldError;
  secaoVisivel = 'pessoal';

  @ViewChild('scrollArea', { static: false }) scrollArea!: ElementRef;

  constructor(
    private notificacao: NotificacaoService,
    private form: FormBuilder,
    private route: Router,
    private pacienteApi: PacienteApiService,
    private filtroStateService: FiltroStateService,
    private cepApiService: CepApiService,
    @Optional() private dialogRef: MatDialogRef<CadastroPacienteComponent>
  ) { }

  ngOnInit(): void {
    this.FormularioPaciente = this.form.group({
      nome: ['', [Validators.required, nomeCompletoValidator(), antiInjectionValidator()]],
      sexo: ['', Validators.required],
      dataNascimento: ['', [Validators.required, dataNascimentoPacienteValidator()]],
      cpf: ['', [Validators.required, cpfValidator()]],
      rg: ['', rgValidator()],
      telefone: ['', telefoneValidator()],
      email: ['', [Validators.required, emailValidator()]],
    });

    this.FormularioEndereco = this.form.group({
      nacionalidade: ['', nacionalidadeValidator()],
      uf: ['', [Validators.required, Validators.maxLength(2)]],
      cep: ['', [Validators.required, cepValidator()]],
      rua: ['', [Validators.required, textoBrValidator(), antiInjectionValidator()]],
      municipio: ['', [Validators.required, textoBrValidator(), antiInjectionValidator()]],
      bairro: ['', [Validators.required, textoBrValidator(), antiInjectionValidator()]],
      numero: ['', [Validators.required, numeroEnderecoValidator()]],
      complemento: ['', antiInjectionValidator()],
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

  irParaSecao(secao: string) {
    this.secaoVisivel = secao;
    const el = document.getElementById('sec-' + secao);
    if (el && this.scrollArea) {
      const container = this.scrollArea.nativeElement;
      const top = el.offsetTop - container.offsetTop;
      container.scrollTo({ top, behavior: 'smooth' });
    }
  }

  onScroll(event?: Event) {
    if (!this.scrollArea) { return; }
    const container = this.scrollArea.nativeElement;
    const scrollTop = container.scrollTop;
    const secoes = ['pessoal', 'endereco'];
    for (const secao of secoes) {
      const el = document.getElementById('sec-' + secao);
      if (!el) { continue; }
      const offsetTop = el.offsetTop - container.offsetTop;
      const offsetBottom = offsetTop + el.offsetHeight;
      if (scrollTop >= offsetTop - 40 && scrollTop < offsetBottom - 40) {
        this.secaoVisivel = secao;
      }
    }
  }

  fechar() {
    if (this.dialogRef) {
      this.dialogRef.close(false);
    }
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
    this.notificacao.mostrarToast(tipo, mensagem);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }




  cadastra() {
    this.FormularioPaciente.markAllAsTouched();
    this.FormularioEndereco.markAllAsTouched();

    if (!this.FormularioEndereco.valid || !this.FormularioPaciente.valid) {
      this.notificacao.fire({
        icon: 'warning',
        title: 'Formulário incompleto',
        text: 'Por favor, preencha todos os campos obrigatórios corretamente.',
      });
      return;
    }

    const paci = this.FormularioPaciente.value;

    if (!paci.cpf || paci.cpf.length < 11) {
      this.notificacao.fire({
        icon: 'warning',
        title: 'CPF inválido',
        text: 'O CPF é obrigatório e deve ser válido.',
      });
      return;
    }

    this.isLoading = true;

    // Preparar payload com limpeza de dados
    const dadosCompletos = this.prepararPayload();


    this.pacienteApi.cadastrarPacientebyOrg(dadosCompletos).subscribe({
      next: () => {
        this.isLoading = false;
        this.notificacao.fire({
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

    const mensagemBack = extrairMensagemErro(error);

    if (mensagemBack?.includes('Duplicate entry') && mensagemBack.includes('paciente.PaciEmail_UNIQUE')) {
      errorMessage = 'Já existe um paciente registrado com esse email.';
    } else if (mensagemBack?.includes('Duplicate entry') && mensagemBack.includes('paciente.PaciCpf_UNIQUE')) {
      errorMessage = 'Já existe um paciente registrado com esse CPF.';
    } else if (mensagemBack?.includes('Duplicate entry') && mensagemBack.includes('paciente.PaciRg_UNIQUE')) {
      errorMessage = 'Já existe um paciente registrado com esse RG.';
    } else if (mensagemBack) {
      errorMessage = mensagemBack;
    } else if (error.status === 0) {
      errorMessage = 'Sem conexão com o servidor.';
    } else if (error.status >= 500) {
      errorMessage = 'Erro no servidor, tente novamente.';
    }

    this.notificacao.fire({
      icon: 'error',
      title: 'Erro',
      text: errorMessage,
    });
  }
}
