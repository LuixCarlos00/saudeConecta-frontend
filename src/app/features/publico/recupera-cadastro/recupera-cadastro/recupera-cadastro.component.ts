import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApiService } from 'src/app/services/api/auth-api.service';
import { tokenService } from 'src/app/util/Token/Token.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recupera-cadastro',
  templateUrl: './recupera-cadastro.component.html',
  styleUrls: ['./recupera-cadastro.component.css'],
})
export class RecuperaCadastroComponent implements OnInit {

  FormularioEmail!: FormGroup;
  isLoading: boolean = false;
  emailEnviado: boolean = false;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthApiService,
  ) {

  }

  ngOnInit() {
    this.FormularioEmail = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  enviarEmail() {
    if (this.FormularioEmail.invalid) return;

    const email = this.FormularioEmail.get('email')?.value;
    this.isLoading = true;

    this.authService.esqueciMinhaSenha({ email }).subscribe({
      next: () => {
        this.isLoading = false;
        this.emailEnviado = true;
        Swal.fire({
          icon: 'success',
          title: 'Email enviado!',
          text: 'Verifique sua caixa de entrada. Uma nova senha foi enviada para o seu email.',
          confirmButtonColor: '#00d9ff'
        });
      },
      error: (erro) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: erro.error?.message || 'Email não encontrado ou erro ao enviar. Verifique se o email está correto.',
          confirmButtonColor: '#00d9ff'
        });
      }
    });
  }

  voltarParaLogin() {
    this.router.navigate(['/login']);
  }

  reenviarEmail() {
    this.emailEnviado = false;
    this.FormularioEmail.reset();
  }
}
