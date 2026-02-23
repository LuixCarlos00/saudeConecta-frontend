import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { AdministradorApiService } from 'src/app/services/api/administrador-api.service';
import { FiltroStateService } from 'src/app/services/state/filtro-state.service';
import { cpfValidator } from 'src/app/util/validators/cpf-form.validator';
import { CpfValidator } from 'src/app/util/validators/cpf.validator';

@Component({
  selector: 'app-cadastro-adm',
  templateUrl: './cadastro-adm.component.html',
  styleUrls: ['./cadastro-adm.component.css'],
})
export class CadastroAdmComponent implements OnInit, OnDestroy {

  private subscription: Subscription | undefined;
  FormularioADM!: FormGroup;
  isLoading = false;

  constructor(
    private router: Router,
    private form: FormBuilder,
    private administradorApi: AdministradorApiService,
    private filtroStateService: FiltroStateService
  ) { }

  ngOnInit() {
    this.FormularioADM = this.form.group({
      nome: ['', Validators.required],
      cpf: ['', [Validators.required, cpfValidator()]],
      email: ['', [Validators.required, Validators.email]],
    });

    // Adicionar listener para formatar CPF
    this.FormularioADM.get('cpf')?.valueChanges.subscribe(value => {
      if (value && value.length <= 14) {
        const formatted = CpfValidator.format(value);
        if (formatted !== value) {
          this.FormularioADM.get('cpf')?.setValue(formatted, { emitEvent: false });
        }
      }
    });

    // Adicionar listener para validar no blur (quando sai do campo)
    this.FormularioADM.get('cpf')?.valueChanges.subscribe(() => {
      // Força a validação quando o valor muda
      this.FormularioADM.get('cpf')?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  validateCpfOnBlur() {
    const cpfControl = this.FormularioADM.get('cpf');
    if (cpfControl) {
      // Marca o campo como 'touched' para mostrar erros
      cpfControl.markAsTouched();
      // Força a validação
      cpfControl.updateValueAndValidity();
    }
  }

  cadastra() {
    if (!this.FormularioADM.valid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulário incompleto',
        text: 'Por favor, preencha todos os campos obrigatórios.',
      });
      return;
    }

    const form = this.FormularioADM.value;

    if (!form.cpf || form.cpf.length < 11) {
      Swal.fire({
        icon: 'warning',
        title: 'CPF inválido',
        text: 'O CPF é obrigatório e será usado como login.',
      });
      return;
    }

    this.isLoading = true;
    const startTime = Date.now();


    this.administradorApi.cadastrarAdminByOrg(this.FormularioADM.value).subscribe({
      next: () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`Cadastro de administrador concluído em ${duration}ms`);

        this.isLoading = false;
        Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Administrador cadastrado com sucesso. As credenciais serão enviadas por email.',
        }).then(() => {
          this.FormularioADM.reset();
          // Emite evento de recarga para atualizar a tabela
          this.filtroStateService.setRecarregar(true);
        });
      },
      error: (error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.error(`Erro no cadastro de administrador após ${duration}ms:`, error);

        this.isLoading = false;
        this.handleHttpError(error);
      }
    });
  }

  private handleHttpError(error: any) {
    let errorMessage = 'Erro desconhecido ao realizar o cadastro.';

    if (error.status === 409) {
      errorMessage = 'CPF já cadastrado no sistema. Por favor, verifique os dados.';
    } else if (error.error) {
      if (error.error.includes && error.error.includes('Email já cadastrado no sistema')) {
        errorMessage = 'Email já cadastrado no sistema. Por favor, utilize outro email.';
      } else if (error.error.includes && error.error.includes('Duplicate entry') && error.error.includes('administrador.AdmEmail_UNIQUE')) {
        errorMessage = 'Já existe um(a) administrador(a) registrado com esse email.';
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

  voltarParaHome() {
    this.router.navigate(['cadastro']);
  }
}
