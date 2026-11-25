import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/auth/auth.service';
import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { extrairCodigoErro, extrairMensagemErro } from 'src/app/shared/utils/mensagem-erro-http';

const MENSAGEM_LINK_INVALIDO = 'Link inválido ou expirado. Solicite uma nova recuperação de senha.';

/** `code` do ErrorResponse do back para token inválido, expirado ou já usado. */
const CODIGO_TOKEN_INVALIDO = 'TOKEN_RECUPERACAO_INVALIDO';

/** Estados da tela: validando o token, formulário liberado ou link inválido. */
export type EstadoRedefinicao = 'carregando' | 'valido' | 'invalido';

/**
 * Validador de grupo: `confirmacaoSenha` deve ser igual a `novaSenha`.
 * @param grupo FormGroup com os controles `novaSenha` e `confirmacaoSenha`
 * @returns `{ senhasDiferentes: true }` quando divergem; senão null
 */
export function senhasIguaisValidator(grupo: AbstractControl): ValidationErrors | null {
  const nova = grupo.get('novaSenha')?.value;
  const confirmacao = grupo.get('confirmacaoSenha')?.value;
  return nova === confirmacao ? null : { senhasDiferentes: true };
}

@Component({
  selector: 'app-redefinir-senha',
  templateUrl: './redefinir-senha.component.html',
  styleUrls: ['./redefinir-senha.component.css'],
})
export class RedefinirSenhaComponent implements OnInit {

  FormularioSenha!: FormGroup;
  estado: EstadoRedefinicao = 'carregando';
  isLoading: boolean = false;
  mostrarSenha: boolean = false;
  mensagemInvalido: string = MENSAGEM_LINK_INVALIDO;
  private token: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private notificacao: NotificacaoService,
  ) {}

  ngOnInit() {
    this.FormularioSenha = this.formBuilder.group({
      novaSenha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
      confirmacaoSenha: ['', [Validators.required]],
    }, { validators: senhasIguaisValidator });

    this.token = this.route.snapshot.queryParamMap.get('token')?.trim() || '';
    if (!this.token) {
      this.estado = 'invalido';
      return;
    }

    this.authService.validarTokenRedefinicao(this.token).subscribe({
      next: () => { this.estado = 'valido'; },
      error: (erro) => {
        this.mensagemInvalido = extrairMensagemErro(erro) || MENSAGEM_LINK_INVALIDO;
        this.estado = 'invalido';
      },
    });
  }

  alternarMostrarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  redefinirSenha() {
    if (this.FormularioSenha.invalid || this.isLoading) return;

    this.isLoading = true;
    const novaSenha = this.FormularioSenha.get('novaSenha')?.value;

    this.authService.redefinirSenha(this.token, novaSenha).subscribe({
      next: (resposta) => {
        this.isLoading = false;
        this.notificacao.fire({
          icon: 'success',
          title: 'Senha redefinida',
          text: resposta?.message || 'Senha redefinida com sucesso. Faça login com a nova senha.',
          confirmButtonColor: '#00d9ff'
        });
        // Sai de uma sessão antiga que ainda esteja no navegador (o token dela pode carregar a
        // troca de senha pendente) e leva ao login para entrar com a senha nova.
        this.authService.logout();
      },
      error: (erro) => {
        this.isLoading = false;
        const mensagem = extrairMensagemErro(erro);
        // O back responde 400 tanto para token ruim quanto para senha fraca (code VALIDACAO); só o primeiro invalida o link.
        if (extrairCodigoErro(erro) === CODIGO_TOKEN_INVALIDO) {
          this.mensagemInvalido = mensagem || MENSAGEM_LINK_INVALIDO;
          this.estado = 'invalido';
          return;
        }
        this.notificacao.fire({
          icon: 'error',
          title: 'Erro',
          text: mensagem || 'Não foi possível redefinir a senha. Tente novamente em instantes.',
          confirmButtonColor: '#00d9ff'
        });
      }
    });
  }

  solicitarNovoLink() {
    this.router.navigate(['/recuperaCadastro']);
  }

  voltarParaLogin() {
    this.router.navigate(['/login']);
  }
}
