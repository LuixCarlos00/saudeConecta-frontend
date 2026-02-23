import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Usuario {
  id?: number;
  login?: string;
  senha?: string;
  role?: string;
  ativo?: boolean;
}

export interface UsuarioResponse {
  id: number;
  login: string;
  tipoUsuario: number;
  status: number;
}

export interface TodosUsuariosAgrupados {
  paciente: any[];
  medico: any[];
  secretaria: any[];
  administrador: any[];
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioApiService {

  private readonly apiUrl = `${environment.apiUrl}/usuario`;

  constructor(private http: HttpClient) { }



  buscarTodosAgrupados(): Observable<TodosUsuariosAgrupados> {
    return this.http.get<TodosUsuariosAgrupados>(`${this.apiUrl}/buscarTodosAgrupados`);
  }


  bloquearUsuariobyOrg(bloquearUsuarioRequest: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/bloquearUsuariobyOrg`, bloquearUsuarioRequest);
  }



  trocarSenharUsuariobyOrg(usuarioId: number, novaSenha: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/trocarSenharUsuariobyOrg/${usuarioId}`, { senhaNova: novaSenha });
  }


















  verificarLoginDisponivel(login: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/buscarUsuarioExistente/${login}`);
  }

  // ==========================================
  // BUSCA DE USUÁRIOS
  // ==========================================

  buscarPorId(id: number): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/buscarId/${id}`);
  }

  buscarPerfilCompleto(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/buscarPerfilCompleto/${id}`);
  }

  buscarPorLogin(login: string): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/buscarLogin/${login}`);
  }

  buscarTodos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/listarTodosSimples`);
  }
  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }


  // ==========================================
  // GERENCIAMENTO DE USUÁRIOS
  // ==========================================





}
