import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { AdministradorApiService } from 'src/app/services/api/administrador-api.service';
import { AuthApiService } from 'src/app/services/api/auth-api.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { el } from 'date-fns/locale';
import { tokenService } from "src/app/util/Token/Token.service";
import { Adiministrador } from 'src/app/util/variados/interfaces/administrado/adiministrador';
import Swal from 'sweetalert2';
import { map, take } from 'rxjs';
import { Usuario } from 'src/app/util/variados/interfaces/usuario/usuario';
import { UsuarioApiService } from 'src/app/services/api/usuario-api.service';

@Component({
  selector: 'app-troca-senha',
  templateUrl: './troca-senha.component.html',
  styleUrls: ['./troca-senha.component.css'],
})
export class TrocaSenhaComponent implements OnInit {
  trocaMinhaSenha: boolean = false;

  UsuarioLogado!: Usuario;

  FormularioTrocaSenha!: FormGroup;

  emailValido: Boolean = false;
  codigoDeSegurancaValidao: Boolean = false;
  PesquisandoEmail: Boolean = false;
  constructor(
    private form: FormBuilder,
    private administradorApiService: AdministradorApiService,
    private usuarioApiService: UsuarioApiService,
    private tokenService: tokenService
  ) {
    this.tokenService.decodificaToken();
    this.tokenService.UsuarioLogadoValue$.subscribe((paciente) => {
      if (paciente) {

        this.UsuarioLogado = paciente;
      }
    });
  }
  //Arrumar a troca de senha   trocarSenharUsuariobyOrg

  ngOnInit(): void {


    this.FormularioTrocaSenha = this.form.group({
       SenhaAntiga: ['', Validators.required],
      SenhaNova: ['', Validators.required],
    });
  }

  EsqueciASenha() {
    this.trocaMinhaSenha = false;
  }

  TrocarSenha() {
    this.trocaMinhaSenha = true;
  }

  enviar() {
    if (this.trocaMinhaSenha) {
      const senhaop1 = this.FormularioTrocaSenha.value.SenhaAntiga;
      const senhaop2 = this.FormularioTrocaSenha.value.SenhaNova;
      const idUsuario = this.UsuarioLogado.id;



      if ((senhaop1 == senhaop2)) {
        this.usuarioApiService.trocarSenharUsuariobyOrg(idUsuario, senhaop1).subscribe(
          (response: any) => {

            this.FormularioTrocaSenha.reset();
            Swal.fire({
              icon: 'success',
              title: ' OK...',
              text: 'Senha alterada com sucesso',
            });

          },
          (error: any) => {
            console.log(error);
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'Senha inválida',
            });
          }
        );
      } {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Senhas diferentes',
        });
      }

    }

  }










  // ============================= ESQUECI A SENHA ==================================










}
