import { Usuario } from './../variados/interfaces/usuario/usuario';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';

import { jwtDecode } from 'jwt-decode';
import { HttpClient } from '@angular/common/http';
import { Paciente } from '../variados/interfaces/paciente/paciente';
import { Adiministrador } from '../variados/interfaces/administrado/adiministrador';
import { Medico } from '../variados/interfaces/medico/medico';
import * as jwt_decode from 'jwt-decode';
import { ApiUrlService } from 'src/app/services/api/api-url.service';

const KEY: string = 'authToken';

@Injectable({ providedIn: 'root' })
export class tokenService {
  //
  //
  //

  constructor(
    private apiUrl_Global : ApiUrlService
  ) {
   this.apiUrl = this.apiUrl_Global.getUrl()
  }

  private apiUrl = '';

  private UsuarioLogadoSubject = new BehaviorSubject<any | null>(null);
  UsuarioLogadoValue$ = this.UsuarioLogadoSubject.asObservable();

  /**
   * Retorna o usuário logado de forma síncrona
   */
  getUsuarioLogado(): any | null {
    return this.UsuarioLogadoSubject.getValue();
  }


  private Usuario = {
    id: 0,
    login: '',
    senha: '',
    roles: '',
  };


  retornaToken() {
    return localStorage.getItem(KEY) ?? '';
  }

  possuiToken(): boolean {
    const token = localStorage.getItem(KEY);
    if (token) {
      return true;
    } else {
      return false;
    }
  }



  public decodificaToken(): void {
    const token = this.retornaToken();
    if (token) {
      const Usuario = jwt_decode.jwtDecode(token) as Usuario;
      this.UsuarioLogadoSubject.next(Usuario);
    }
  }



  obterAutorizacao(): string {
    this.decodificaToken();
    const usuario = this.UsuarioLogadoSubject.getValue();
    return usuario ? usuario.aud : '';
  }

  obterOrganizacaoId(): number | null {
    this.decodificaToken();
    const usuario = this.UsuarioLogadoSubject.getValue();
    return usuario ? usuario.organizacaoId : null;
  }

  obterUsuarioId(): number | null {
    this.decodificaToken();
    const usuario = this.UsuarioLogadoSubject.getValue();
    return usuario ? usuario.id : null;
  }

  obterNome(): string | null {
    this.decodificaToken();
    const usuario = this.UsuarioLogadoSubject.getValue();
    return usuario ? usuario.nome : null;
  }

}
