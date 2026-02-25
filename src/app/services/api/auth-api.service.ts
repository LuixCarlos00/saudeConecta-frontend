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

  constructor(private http: HttpClient) { }


  login(credenciais: { login: string; senha: string }): Observable<HttpResponse<LoginResponse>> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credenciais, { observe: 'response' });
  }

  esqueciMinhaSenha(dados: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/esqueciMinhaSenha`, dados);
  }
}
