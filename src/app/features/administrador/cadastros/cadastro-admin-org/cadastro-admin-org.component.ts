import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
    private filtroStateService: FiltroStateService
  ) {}

  ngOnInit(): void {
    this.formulario = this.fb.group({
      nome:       ['', Validators.required],
      cpf:        ['', [Validators.required, Validators.minLength(11)]],
      cargo:      ['', Validators.required],
      email:      ['', [Validators.required, Validators.email]],

      nomeClinica:  ['', Validators.required],
      razaoSocial:  ['', Validators.required],
      cnpj:         ['', Validators.required],
      tipoClinica:  ['', Validators.required],
      emailClinica: ['', Validators.email],
      telefone:     [''],

      cep:        ['', Validators.required],
      uf:         ['', Validators.required],
      municipio:  ['', Validators.required],
      bairro:     [''],
      rua:        ['', Validators.required],
      numero:     ['', Validators.required],
      complemento:[''],
    });

    this.formulario.get('cpf')?.valueChanges.subscribe(value => {
      if (value && value.length <= 14) {
        const formatted = CpfValidator.format(value);
        if (formatted !== value) {
          this.formulario.get('cpf')?.setValue(formatted, { emitEvent: false });
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
          text: 'Organização e administrador cadastrados. O login é o CPF e a senha inicial é o próprio CPF.',
        }).then(() => {
          this.formulario.reset();
          this.filtroStateService.setRecarregar(true);
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.handleHttpError(error);
      }
    });
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
