import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface LoginResponse {
  tokenJWT: string;
  usuarioView: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {

  private readonly apiUrl = `${environment.apiUrl}/Home`;

  constructor(private http: HttpClient) {}

  // ==========================================
  // AUTENTICAÇÃO
  // ==========================================

  login(credenciais: { login: string; senha: string }): Observable<HttpResponse<LoginResponse>> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credenciais, { observe: 'response' });
  }

  // ==========================================
  // TROCA DE SENHA
  // ==========================================

  trocarSenha(dados: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/TrocaSenhaADM`, dados);
  }

  esqueciMinhaSenha(dados: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/esqueciMinhaSenha`, dados);
  }

  trocaSenhaUsuario(id: number, user: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/Home/trocaDeSenha/${id}`, user);
  }

  TrocaSenhaDoUsuario(codigo: any, senhaNovaDTO: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/Home/TrocaSenhaDoUsuario/${codigo}`, senhaNovaDTO);
  }


  iniciarObservacaoDadosUsuario(): void {
    // Método placeholder para compatibilidade com código legado
    // A lógica de observação deve ser feita via tokenService
  }

  // ==========================================
  // MÉTODOS LEGADOS
  // ==========================================

  private NovoUsuariocadastradoSubject = new BehaviorSubject<any | null>(null);
  NovoUsuariocadastradoValue$ = this.NovoUsuariocadastradoSubject.asObservable();



  // ==========================================
  // RECUPERAÇÃO DE CADASTRO
  // ==========================================

  recuperaLogin(id: number, tipoUsusario: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/Home/recuperaLogin=${id}&dados=${tipoUsusario}`);
  }

  ObeterCodigoParaRecuperacaoDeSenhaPassandoOEmail(email: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/administrador/buscarPorEmail/${email}`);
  }

  ConfirmaCodigoDeSeguraca(codigo: any): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/administrador/InserirCodigo/${codigo}`);
  }
}
