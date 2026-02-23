import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { SecretariaApiService } from 'src/app/services/api/secretaria-api.service';
import { FiltroStateService } from 'src/app/services/state/filtro-state.service';
import { cpfValidator } from 'src/app/util/validators/cpf-form.validator';
import { CpfValidator } from 'src/app/util/validators/cpf.validator';

@Component({
  selector: 'app-cadastro-secretaria',
  templateUrl: './cadastro-secretaria.component.html',
  styleUrls: ['./cadastro-secretaria.component.css'],
})
export class CadastroSecretariaComponent implements OnInit, OnDestroy {

  private usuarioSubscription: Subscription | undefined;
  FormularioSecretaria!: FormGroup;
  isLoading = false;

  constructor(
    private router: Router,
    private form: FormBuilder,
    private secretariaApiService: SecretariaApiService,
    private filtroStateService: FiltroStateService
  ) { }

  ngOnInit() {
    this.FormularioSecretaria = this.form.group({
      nome: ['', Validators.required],
      cpf: ['', [Validators.required, cpfValidator()]],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', Validators.required],
    });

    // Adicionar listener para formatar CPF
    this.FormularioSecretaria.get('cpf')?.valueChanges.subscribe(value => {
      if (value && value.length <= 14) {
        const formatted = CpfValidator.format(value);
        if (formatted !== value) {
          this.FormularioSecretaria.get('cpf')?.setValue(formatted, { emitEvent: false });
        }
      }
    });

    // Adicionar listener para validar no blur (quando sai do campo)
    this.FormularioSecretaria.get('cpf')?.valueChanges.subscribe(() => {
      // Força a validação quando o valor muda
      this.FormularioSecretaria.get('cpf')?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
  }

  ngOnDestroy(): void {
    if (this.usuarioSubscription) {
      this.usuarioSubscription.unsubscribe();
    }
  }

  validateCpfOnBlur() {
    const cpfControl = this.FormularioSecretaria.get('cpf');
    if (cpfControl) {
      // Marca o campo como 'touched' para mostrar erros
      cpfControl.markAsTouched();
      // Força a validação
      cpfControl.updateValueAndValidity();
    }
  }

  cadastra() {
    if (!this.FormularioSecretaria.valid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulário incompleto',
        text: 'Por favor, preencha todos os campos obrigatórios.',
      });
      return;
    }

    const form = this.FormularioSecretaria.value;

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



    this.secretariaApiService.cadastrarSecretariaByOrg(this.FormularioSecretaria.value).subscribe({
      next: () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`Cadastro concluído em ${duration}ms`);

        this.isLoading = false;
        Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Secretária cadastrada com sucesso. As credenciais serão enviadas por email.',
        }).then(() => {
          this.FormularioSecretaria.reset();
          // Emite evento de recarga para atualizar a tabela
          this.filtroStateService.setRecarregar(true);
        });
      },
      error: (error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.error(`Erro no cadastro após ${duration}ms:`, error);

        this.isLoading = false;
        this.handleHttpError(error);
      }
    });
  }

  private handleHttpError(error: any) {
    let errorMessage = 'Erro desconhecido ao realizar o cadastro.';
    let titulo = 'Erro';

    if (error.status === 409) {
      titulo = 'Error';
      errorMessage = typeof error.error === 'string' ? error.error : 'CPF já cadastrado no sistema. Por favor, verifique os dados.';
    } else if (error.status === 400) {
      titulo = 'Dados inválidos';
      errorMessage = typeof error.error === 'string' ? error.error : 'Verifique os dados informados.';
    } else if (error.error) {
      if (error.error.includes && error.error.includes('Email já cadastrado no sistema')) {
        titulo = 'Email já cadastrado';
        errorMessage = 'Email já cadastrado no sistema. Por favor, utilize outro email.';
      } else if (error.error.includes && error.error.includes('Duplicate entry')) {
        titulo = 'Registro duplicado';
        errorMessage = 'Já existe um registro com esses dados.';
      } else {
        errorMessage = typeof error.error === 'string' ? error.error : 'Erro ao processar cadastro.';
      }
    }

    Swal.fire({
      icon: 'error',
      title: titulo,
      text: errorMessage,
    });
  }

  voltarParaHome() {
    this.router.navigate(['cadastro']);
  }
}
