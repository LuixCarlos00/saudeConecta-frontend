import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PlanoAssinatura, PlanoAssinaturaRequest } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlanoApiService {

  private readonly apiUrl = `${environment.apiUrl}/planos`;

  constructor(private http: HttpClient) { }

  /**
   * Lista todos os planos ativos.
   * @returns Observable com lista de planos
   */
  listarPlanosAtivos(): Observable<PlanoAssinatura[]> {
    return this.http.get<PlanoAssinatura[]>(this.apiUrl);
  }

  /**
   * Busca um plano por ID.
   * @param id ID do plano
   * @returns Observable com o plano
   */
  buscarPorId(id: number): Observable<PlanoAssinatura> {
    return this.http.get<PlanoAssinatura>(`${this.apiUrl}/${id}`);
  }

  /**
   * Busca um plano por tipo.
   * @param tipo tipo do plano (STARTER, PROFISSIONAL, BUSINESS)
   * @returns Observable com o plano
   */
  buscarPorTipo(tipo: string): Observable<PlanoAssinatura> {
    return this.http.get<PlanoAssinatura>(`${this.apiUrl}/tipo/${tipo}`);
  }

  /**
   * Cria um novo plano (SUPER_ADMIN).
   * @param request dados do plano
   * @returns Observable com o plano criado
   */
  criarPlano(request: PlanoAssinaturaRequest): Observable<PlanoAssinatura> {
    return this.http.post<PlanoAssinatura>(this.apiUrl, request);
  }

  /**
   * Atualiza um plano existente (SUPER_ADMIN).
   * @param id ID do plano
   * @param request dados atualizados
   * @returns Observable com o plano atualizado
   */
  atualizarPlano(id: number, request: PlanoAssinaturaRequest): Observable<PlanoAssinatura> {
    return this.http.put<PlanoAssinatura>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Desativa um plano (SUPER_ADMIN).
   * @param id ID do plano
   * @returns Observable void
   */
  desativarPlano(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
