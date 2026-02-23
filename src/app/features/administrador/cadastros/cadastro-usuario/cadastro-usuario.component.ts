import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsuarioApiService } from 'src/app/services/api/usuario-api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cadastro-usuario',
  templateUrl: './cadastro-usuario.component.html',
  styleUrls: ['./cadastro-usuario.component.css'],
})
export class CadastroUsuarioComponent implements OnInit {
  FormularioUsuario!: FormGroup;
  showPassword = false;
  isLoading = false;
  loginValidado = false;

  @Input() RolesUsuario!: any;
  @Output() credenciaisValidadas = new EventEmitter<{ login: string; senha: string }>();

  constructor(
    private form: FormBuilder,
    private usuarioApi: UsuarioApiService
  ) {}

  ngOnInit(): void {
    this.FormularioUsuario = this.form.group({
      login: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  verificarLogin() {
    if (!this.FormularioUsuario.valid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulário inválido',
        text: 'Preencha o login e a senha corretamente.',
      });
      return;
    }

    const login = this.FormularioUsuario.get('login')?.value;
    this.isLoading = true;

    this.usuarioApi.verificarLoginDisponivel(login).subscribe({
      next: (disponivel: boolean) => {
        this.isLoading = false;
        if (disponivel) {
          // Login disponível (true = pode usar)
          this.loginValidado = true;
          this.FormularioUsuario.disable();

          // Emite as credenciais para o componente pai
          this.credenciaisValidadas.emit({
            login: this.FormularioUsuario.get('login')?.value,
            senha: this.FormularioUsuario.get('password')?.value
          });

          Swal.fire({
            icon: 'success',
            title: 'Login disponível!',
            text: 'Agora preencha os dados do cadastro abaixo.',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          // Login já existe (false = não pode usar)
          Swal.fire({
            icon: 'error',
            title: 'Login já existe',
            text: 'Este login já está cadastrado no sistema. Por favor, escolha outro.',
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Erro ao verificar login. Tente novamente.',
        });
      }
    });
  }

  editarCredenciais() {
    this.loginValidado = false;
    this.FormularioUsuario.enable();
  }
}
