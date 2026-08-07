import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CepApiService } from 'src/app/services/api/cep-api.service';
import { PlanoApiService } from 'src/app/services/api/plano-api.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { AdministradorApiService } from 'src/app/services/api/administrador-api.service';
import { FiltroStateService } from 'src/app/services/state/filtro-state.service';
import { CpfValidator } from 'src/app/util/validators/cpf.validator';
import { cpfValidator } from 'src/app/util/validators/cpf-form.validator';
import { getFieldError } from 'src/app/util/validators/field-errors';
import {
  nomeCompletoValidator,
  emailValidator,
  telefoneValidator,
  cepValidator,
  textoBrValidator,
  numeroEnderecoValidator,
  cnpjValidator,
  antiInjectionValidator,
} from 'src/app/util/validators/form-validators';
import { PlanoAssinatura } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';

@Component({
  selector: 'app-cadastro-admin-org',
  templateUrl: './cadastro-admin-org.component.html',
  styleUrls: ['./cadastro-admin-org.component.css'],
})
export class CadastroAdminOrgComponent implements OnInit, OnDestroy {

  private subscription: Subscription | undefined;
  formulario!: FormGroup;
  isLoading = false;
  isBuscandoCep = false;
  isLoadingPlanos = false;
  planos: PlanoAssinatura[] = [];
  isJuridica = true;
  getFieldError = getFieldError;

  readonly tiposClinica = [
    { value: 'CLINICA_MEDICA', label: 'Clínica Médica' },
    { value: 'CLINICA_ODONTOLOGICA', label: 'Clínica Odontológica' },
    { value: 'MISTA', label: 'Clínica Mista' },
    { value: 'CLINICA', label: 'Clínica' },
    { value: 'CONSULTORIO', label: 'Consultório' },
    { value: 'HOSPITAL', label: 'Hospital' },
    { value: 'LABORATORIO', label: 'Laboratório' },
    { value: 'UPA', label: 'UPA' },
  ];

  readonly cargos = [
    { value: 'GERENTE', label: 'Gerente' },
    { value: 'DIRETOR_ADMINISTRATIVO', label: 'Diretor Administrativo' },
  ];

  readonly ufs = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
    'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  ];

  constructor(
    private fb: FormBuilder,
    private administradorApi: AdministradorApiService,
    private filtroStateService: FiltroStateService,
    private cepApiService: CepApiService,
    private planoApiService: PlanoApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarPlanos();

    this.formulario = this.fb.group({
      tipoPessoa:   ['JURIDICA', Validators.required],
      nome:         ['', [Validators.required, nomeCompletoValidator(), antiInjectionValidator()]],
      cpf:          ['', [Validators.required, cpfValidator()]],
      cargo:        ['', Validators.required],
      email:        ['', [Validators.required, emailValidator()]],

      nomeClinica:  ['', [Validators.required, textoBrValidator(3, 100), antiInjectionValidator()]],
      razaoSocial:  ['', [Validators.required, textoBrValidator(3, 150), antiInjectionValidator()]],
      cnpj:         ['', [Validators.required, cnpjValidator()]],
      tipoClinica:  ['', Validators.required],
      emailClinica: ['', [Validators.required, emailValidator()]],
      telefone:     ['', telefoneValidator()],

      cep:          ['', [Validators.required, cepValidator()]],
      uf:           ['', Validators.required],
      municipio:    ['', [Validators.required, textoBrValidator(2, 100), antiInjectionValidator()]],
      bairro:       ['', [Validators.required, textoBrValidator(2, 100), antiInjectionValidator()]],
      rua:          ['', [Validators.required, textoBrValidator(2, 200), antiInjectionValidator()]],
      numero:       ['', [Validators.required, numeroEnderecoValidator()]],
      complemento:  ['', antiInjectionValidator()],
      planoId: ['', Validators.required],
    });

    this.formulario.get('cpf')?.valueChanges.subscribe(value => {
      if (value) {
        const formatted = CpfValidator.format(value);
        if (formatted !== value) {
          this.formulario.get('cpf')?.setValue(formatted, { emitEvent: false });
        }
      }
    });

    this.formulario.get('cnpj')?.valueChanges.subscribe(value => {
      if (value) {
        const formatted = this.formatarCnpj(value);
        if (formatted !== value) {
          this.formulario.get('cnpj')?.setValue(formatted, { emitEvent: false });
        }
      }
    });

    this.formulario.get('cep')?.valueChanges.subscribe(value => {
      if (value) {
        const formatted = this.formatarCep(value);
        if (formatted !== value) {
          this.formulario.get('cep')?.setValue(formatted, { emitEvent: false });
        }
      }
    });


  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  carregarPlanos(): void {
    this.isLoadingPlanos = true;
    this.planoApiService.listarPlanosAtivos().subscribe({
      next: (planos) => {
        this.planos = planos;
        this.isLoadingPlanos = false;
      },
      error: () => {
        this.isLoadingPlanos = false;
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Erro ao carregar planos disponíveis.' });
      }
    });
  }

  onTipoPessoaChange(): void {
    const tipoPessoa = this.formulario.get('tipoPessoa')?.value;
    this.isJuridica = tipoPessoa === 'JURIDICA';

    // Atualizar validadores baseados no tipo de pessoa
    const companyFields = ['nomeClinica', 'razaoSocial', 'cnpj', 'tipoClinica', 'emailClinica', 'telefone'];
    
    if (this.isJuridica) {
      // Tornar campos obrigatórios para JURIDICA
      companyFields.forEach(field => {
        this.formulario.get(field)?.addValidators([Validators.required]);
        this.formulario.get(field)?.updateValueAndValidity();
      });
    } else {
      // Remover validadores obrigatórios para FISICA
      companyFields.forEach(field => {
        this.formulario.get(field)?.removeValidators([Validators.required]);
        this.formulario.get(field)?.updateValueAndValidity();
      });
    }
  }

  validateCpfOnBlur(): void {
    this.formulario.get('cpf')?.markAsTouched();
  }

  buscarCep(): void {
    const cep = this.formulario.get('cep')?.value?.replace(/[^0-9]/g, '');
    if (!cep || cep.length !== 8) return;

    this.isBuscandoCep = true;
    this.cepApiService.buscarEnderecoPorCep(cep).subscribe({
      next: (data) => {
        this.isBuscandoCep = false;
        this.formulario.patchValue({
          rua:       data.logradouro || '',
          bairro:    data.bairro    || '',
          municipio: data.localidade || '',
          uf:        data.uf        || '',
        });
      },
      error: () => {
        this.isBuscandoCep = false;
        Swal.fire({ icon: 'warning', title: 'CEP não encontrado', text: 'Verifique o CEP informado.' });
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/gerenciamento']);
  }

  cadastrar(): void {
    // Validação adicional para campos obrigatórios baseados no tipo de pessoa
    if (this.isJuridica) {
      const companyFields = ['nomeClinica', 'razaoSocial', 'cnpj', 'tipoClinica', 'emailClinica', 'telefone'];
      for (const field of companyFields) {
        if (!this.formulario.get(field)?.value) {
          this.formulario.get(field)?.markAsTouched();
        }
      }
    }

    if (!this.formulario.valid) {
      this.formulario.markAllAsTouched();
      Swal.fire({ icon: 'warning', title: 'Formulário incompleto', text: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    this.isLoading = true;
    const payload = {
      ...this.formulario.value,
      numero: parseInt(this.formulario.value.numero, 10),
      planoId: parseInt(this.formulario.value.planoId, 10)
    };

    this.administradorApi.cadastrarAdminOrgCompleto(payload).subscribe({
      next: () => {
        this.isLoading = false;
        Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Organização e administrador cadastrados. O login é o CNPJ e a senha foi enviada por email.',
        }).then(() => {
          this.formulario.reset();
          this.filtroStateService.setRecarregar(true);
          this.router.navigate(['/Gerenciamento-Usuarios']);
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.handleHttpError(error);
      }
    });
  }

  private formatarCnpj(value: string): string {
    const n = value.replace(/[^\d]/g, '');
    if (n.length <= 2)  return n;
    if (n.length <= 5)  return n.replace(/(\d{2})(\d+)/, '$1.$2');
    if (n.length <= 8)  return n.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
    if (n.length <= 12) return n.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
    return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
  }

  private formatarCep(value: string): string {
    const n = value.replace(/[^\d]/g, '');
    if (n.length <= 5) return n;
    return n.replace(/(\d{5})(\d+)/, '$1-$2');
  } 
  private handleHttpError(error: any): void {
    let msg = 'Erro desconhecido ao realizar o cadastro.';
    if (error.status === 409) {
      msg = typeof error.error === 'string' ? error.error : 'CPF ou CNPJ já cadastrado no sistema.';
    } else if (error.error && typeof error.error === 'string') {
      msg = error.error;
    }
    Swal.fire({ icon: 'error', title: 'Erro', text: msg });
  }
}
