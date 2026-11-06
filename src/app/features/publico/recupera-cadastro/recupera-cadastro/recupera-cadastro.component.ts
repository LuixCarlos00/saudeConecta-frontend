import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/auth/auth.service';
import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { extrairMensagemErro } from 'src/app/shared/utils/mensagem-erro-http';

const MENSAGEM_NEUTRA = 'Se o e-mail estiver cadastrado, você receberá as instruções para recuperar a senha.';

@Component({
  selector: 'app-recupera-cadastro',
  templateUrl: './recupera-cadastro.component.html',
  styleUrls: ['./recupera-cadastro.component.css'],
})
export class RecuperaCadastroComponent implements OnInit {

  FormularioEmail!: FormGroup;
  isLoading: boolean = false;
  emailEnviado: boolean = false;
  /** Mensagem neutra exibida após o envio (não revela se o e-mail existe). */
  mensagemSucesso: string = MENSAGEM_NEUTRA;

  constructor(
    private notificacao: NotificacaoService,
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
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
      next: (resposta) => {
        this.isLoading = false;
        this.emailEnviado = true;
        this.mensagemSucesso = resposta?.message || MENSAGEM_NEUTRA;
        this.notificacao.fire({
          icon: 'success',
          title: 'Solicitação recebida',
          text: this.mensagemSucesso,
          confirmButtonColor: '#00d9ff'
        });
      },
      error: (erro) => {
        this.isLoading = false;
        this.notificacao.fire({
          icon: 'error',
          title: 'Erro',
          text: extrairMensagemErro(erro) || 'Não foi possível processar a solicitação. Tente novamente em instantes.',
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
