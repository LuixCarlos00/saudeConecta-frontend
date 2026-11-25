import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { el } from 'date-fns/locale';
import { AuthService } from 'src/app/core/auth/auth.service';
import { Adiministrador } from 'src/app/shared/models/adiministrador';
import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { map, take, filter } from 'rxjs';
import { Usuario } from 'src/app/shared/models/usuario';
import { UsuarioApiService } from 'src/app/core/data-access/usuario-api.service';

@Component({
  selector: 'app-troca-senha',
  templateUrl: './troca-senha.component.html',
  styleUrls: ['./troca-senha.component.css'],
})
export class TrocaSenhaComponent implements OnInit {
  /** O formulário já abre visível (antes ficava escondido atrás de um botão "Trocar Senha"). */
  trocaMinhaSenha: boolean = true;

  /** Mesmo mínimo do back (8 a 100 caracteres). */
  readonly TAMANHO_MINIMO = 8;
  /** Senha provisória (enviada por e-mail no cadastro ou definida pelo gestor): precisa ser trocada antes de usar o sistema. */
  primeiroAcesso = false;
  mostrarSenha = false;
  mostrarConfirmacao = false;
  enviando = false;

  UsuarioLogado!: Usuario;

  FormularioTrocaSenha!: FormGroup;

  constructor(
    private notificacao: NotificacaoService,
    private form: FormBuilder,
    private usuarioApiService: UsuarioApiService,
    private authService: AuthService
  ) {
    this.authService.currentUser$.pipe(filter(Boolean), take(1)).subscribe((paciente) => {
      if (paciente) {

        this.UsuarioLogado = paciente;
      }
    });
  }

  ngOnInit(): void {
    this.primeiroAcesso = this.authService.deveTrocarSenha();

    this.FormularioTrocaSenha = this.form.group({
      // Nomes herdados: SenhaAntiga é a nova senha e SenhaNova é a confirmação
      SenhaAntiga: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
      SenhaNova: ['', Validators.required],
    });
  }

  TrocarSenha() {
    this.trocaMinhaSenha = true;
  }

  /** Nova senha digitada. */
  get senha(): string {
    return this.FormularioTrocaSenha?.value?.SenhaAntiga || '';
  }

  /** Confirmação digitada. */
  get confirmacao(): string {
    return this.FormularioTrocaSenha?.value?.SenhaNova || '';
  }

  /** Requisitos mostrados enquanto a pessoa digita. Só o tamanho é obrigatório (é o que o back exige). */
  get requisitos(): { texto: string; ok: boolean; obrigatorio: boolean }[] {
    const s = this.senha;
    return [
      { texto: `Pelo menos ${this.TAMANHO_MINIMO} caracteres`, ok: s.length >= this.TAMANHO_MINIMO, obrigatorio: true },
      { texto: 'Letras maiúsculas e minúsculas', ok: /[a-z]/.test(s) && /[A-Z]/.test(s), obrigatorio: false },
      { texto: 'Pelo menos um número', ok: /\d/.test(s), obrigatorio: false }
    ];
  }

  /** A confirmação foi digitada e é diferente da senha. */
  get senhasDiferentes(): boolean {
    return this.confirmacao.length > 0 && this.confirmacao !== this.senha;
  }

  /** Libera o botão: tamanho mínimo e confirmação igual. */
  get podeEnviar(): boolean {
    return !this.enviando && this.senha.length >= this.TAMANHO_MINIMO && this.senha.length <= 100
      && this.confirmacao === this.senha;
  }

  enviar() {
    if (!this.trocaMinhaSenha) { return; }
    const senhaop1 = this.FormularioTrocaSenha.value.SenhaAntiga;
    const senhaop2 = this.FormularioTrocaSenha.value.SenhaNova;
    const idUsuario = this.UsuarioLogado.id;

    if (senhaop1 != senhaop2) {
      this.notificacao.fire({ icon: 'error', title: 'Oops...', text: 'Senhas diferentes' });
      return;
    }
    if (!senhaop1 || senhaop1.length < this.TAMANHO_MINIMO) {
      this.notificacao.fire({ icon: 'error', title: 'Senha curta', text: `A senha precisa ter pelo menos ${this.TAMANHO_MINIMO} caracteres.` });
      return;
    }

    this.enviando = true;
    this.usuarioApiService.trocarSenharUsuariobyOrg(idUsuario, senhaop1).subscribe(
      () => {
        this.enviando = false;
        this.FormularioTrocaSenha.reset();
        if (this.primeiroAcesso) {
          // O token atual ainda carrega a troca pendente: um novo login emite o token liberado
          this.authService.logout();
          this.notificacao.fire({ icon: 'success', title: 'Senha criada', text: 'Entre novamente com a sua nova senha.' });
          return;
        }
        this.notificacao.fire({ icon: 'success', title: 'Senha alterada', text: 'Senha alterada com sucesso' });
      },
      () => {
        this.enviando = false;
        this.notificacao.fire({ icon: 'error', title: 'Oops...', text: 'Senha inválida' });
      }
    );
  }
}
