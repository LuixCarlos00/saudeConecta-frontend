import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CadastroSaasRequest, CadastroSaasResponse } from 'src/app/shared/models/PlanoAssinatura';
import { environment } from 'src/environments/environment';

/**
 * Auto-cadastro SaaS a partir da landing page (endpoint público, sem token).
 */
@Injectable({
  providedIn: 'root'
})
export class CadastroPublicoApiService {

  private readonly apiUrl = `${environment.apiUrl}/publico/cadastro`;

  constructor(private http: HttpClient) { }

  /**
   * Cria organização, administrador e assinatura em trial de 30 dias.
   * @param request dados do cadastro
   * @returns Observable com os identificadores criados e a mensagem de sucesso
   */
  cadastrar(request: CadastroSaasRequest): Observable<CadastroSaasResponse> {
    return this.http.post<CadastroSaasResponse>(this.apiUrl, request);
  }
}
