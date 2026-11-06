import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  RascunhoAtendimentoRequest,
  RascunhoAtendimentoResponse,
  RascunhoResumo,
} from 'src/app/shared/models/RascunhoAtendimento';
import { environment } from 'src/environments/environment';

/**
 * Acesso às rotas do rascunho do atendimento (`/atendimentos/.../rascunho`).
 * O rascunho vive no banco; nunca em localStorage (dado clínico).
 */
@Injectable({ providedIn: 'root' })
export class RascunhoAtendimentoApiService {

  private readonly apiUrl = `${environment.apiUrl}/atendimentos`;

  constructor(private http: HttpClient) { }

  /**
   * Busca o rascunho de uma consulta.
   * @param consultaId ID da consulta
   * @returns rascunho, ou null quando não existe (204)
   */
  buscar(consultaId: number): Observable<RascunhoAtendimentoResponse | null> {
    return this.http
      .get<RascunhoAtendimentoResponse>(`${this.apiUrl}/${consultaId}/rascunho`, { observe: 'response' })
      .pipe(map(resposta => (resposta.status === 204 ? null : resposta.body)));
  }

  /**
   * Grava (cria ou atualiza) o rascunho de uma consulta.
   * @param consultaId ID da consulta
   * @param request tipo, dados, cronômetro e versão atual
   * @returns rascunho gravado, com a versão nova
   */
  salvar(consultaId: number, request: RascunhoAtendimentoRequest): Observable<RascunhoAtendimentoResponse> {
    return this.http.put<RascunhoAtendimentoResponse>(`${this.apiUrl}/${consultaId}/rascunho`, request);
  }

  /**
   * Descarta o rascunho de uma consulta (idempotente).
   * @param consultaId ID da consulta
   */
  descartar(consultaId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${consultaId}/rascunho`);
  }

  /**
   * Lista os rascunhos do profissional logado (para a agenda mostrar "Retomar atendimento").
   * @returns resumos dos rascunhos
   */
  listarMeus(): Observable<RascunhoResumo[]> {
    return this.http.get<RascunhoResumo[]>(`${this.apiUrl}/rascunhos/meus`);
  }
}
