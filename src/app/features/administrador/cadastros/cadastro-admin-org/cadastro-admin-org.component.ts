import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CepApiService } from 'src/app/services/api/cep-api.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { AdministradorApiService } from 'src/app/services/api/administrador-api.service';
import { FiltroStateService } from 'src/app/services/state/filtro-state.service';
import { CpfValidator } from 'src/app/util/validators/cpf.validator';

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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.formulario = this.fb.group({
      nome:         ['', Validators.required],
      cpf:          ['', [Validators.required, Validators.minLength(11)]],
      cargo:        ['', Validators.required],
      email:        ['', [Validators.required, Validators.email]],

      nomeClinica:  ['', Validators.required],
      razaoSocial:  ['', Validators.required],
      cnpj:         ['', [Validators.required, Validators.minLength(14)]],
      tipoClinica:  ['', Validators.required],
      emailClinica: ['', [Validators.required, Validators.email]],
      telefone:     ['',Validators.required],

      cep:          ['', Validators.required],
      uf:           ['', Validators.required],
      municipio:    ['', Validators.required],
      bairro:       ['',Validators.required],
      rua:          ['', Validators.required],
      numero:       ['', Validators.required],
      complemento:  [''],
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

    this.formulario.get('telefone')?.valueChanges.subscribe(value => {
      if (value) {
        const formatted = this.formatarTelefone(value);
        if (formatted !== value) {
          this.formulario.get('telefone')?.setValue(formatted, { emitEvent: false });
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
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
    if (!this.formulario.valid) {
      this.formulario.markAllAsTouched();
      Swal.fire({ icon: 'warning', title: 'Formulário incompleto', text: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    this.isLoading = true;
    const payload = {
      ...this.formulario.value,
      numero: parseInt(this.formulario.value.numero, 10)
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

  private formatarTelefone(value: string): string {
    const n = value.replace(/[^\d]/g, '');
    if (n.length <= 2)  return n;
    if (n.length <= 6)  return n.replace(/(\d{2})(\d+)/, '($1) $2');
    if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
    return n.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
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
