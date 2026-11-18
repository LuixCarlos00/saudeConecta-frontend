import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FiltroHistorico, PaginaHistorico } from 'src/app/features/auditoria/models/historico-dados-pessoais';

/** Auditoria de alterações de dados cadastrais (exclusivo do SUPER_ADMIN). */
@Injectable({
  providedIn: 'root'
})
export class HistoricoDadosPessoaisApiService {

  private readonly apiUrl = `${environment.apiUrl}/historico-dados-pessoais`;

  constructor(private http: HttpClient) { }

  /**
   * Alterações de todas as clínicas, mais recentes primeiro. Filtro vazio não vai na URL.
   *
   * @param filtro clínica, tipo de cadastro, período, campo, página e tamanho
   * @returns página de alterações
   */
  pesquisar(filtro: FiltroHistorico = {}): Observable<PaginaHistorico> {
    let params = new HttpParams();
    if (filtro.organizacaoId) { params = params.set('organizacaoId', filtro.organizacaoId); }
    if (filtro.entidade) { params = params.set('entidade', filtro.entidade); }
    if (filtro.de) { params = params.set('de', filtro.de); }
    if (filtro.ate) { params = params.set('ate', filtro.ate); }
    const campo = filtro.campo?.trim();
    if (campo) { params = params.set('campo', campo); }
    if (filtro.page !== undefined) { params = params.set('page', filtro.page); }
    if (filtro.size !== undefined) { params = params.set('size', filtro.size); }
    return this.http.get<PaginaHistorico>(this.apiUrl, { params });
  }
}
