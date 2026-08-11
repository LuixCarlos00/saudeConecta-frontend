import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PageResponse } from 'src/app/util/variados/interfaces/mensageria/Mensageria';
import {
  AtualizarStatusChamadoRequest,
  ChamadoSuporteRequest,
  ChamadoSuporteResponse,
  PrioridadeChamado,
  StatusChamado
} from 'src/app/util/variados/interfaces/suporte/ChamadoSuporte';

export {
  AtualizarStatusChamadoRequest,
  ChamadoSuporteRequest,
  ChamadoSuporteResponse,
  PrioridadeChamado,
  StatusChamado
};

/**
 * Serviço de integração com os endpoints de chamados de suporte.
 */
@Injectable({
  providedIn: 'root'
})
export class ChamadoSuporteApiService {

  private readonly apiUrl = `${environment.apiUrl}/chamados-suporte`;

  constructor(private http: HttpClient) { }

  /**
   * Cadastra um novo chamado de suporte.
   *
   * @param request Dados do chamado (título, corpo, categoria, prioridade e anexos)
   * @returns Chamado criado com protocolo e previsão de atendimento
   */
  cadastrar(request: ChamadoSuporteRequest): Observable<ChamadoSuporteResponse> {
    return this.http.post<ChamadoSuporteResponse>(this.apiUrl, request);
  }

  /**
   * Lista os chamados da organização do usuário autenticado.
   *
   * @param status     Filtro opcional por status
   * @param prioridade Filtro opcional por prioridade
   * @param page       Número da página
   * @param size       Tamanho da página
   * @returns Página de chamados (sem anexos)
   */
  listarTodos(
    status?: StatusChamado,
    prioridade?: PrioridadeChamado,
    page = 0,
    size = 20
  ): Observable<PageResponse<ChamadoSuporteResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) params = params.set('status', status);
    if (prioridade) params = params.set('prioridade', prioridade);

    return this.http.get<PageResponse<ChamadoSuporteResponse>>(this.apiUrl, { params });
  }

  /**
   * Busca um chamado específico com seus anexos.
   *
   * @param id Identificador do chamado (ex.: 230423-324234-32423)
   * @returns Chamado com a lista de anexos
   */
  buscarPorId(id: string): Observable<ChamadoSuporteResponse> {
    return this.http.get<ChamadoSuporteResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Atualiza o status de um chamado (exclusivo do perfil ROOT/suporte).
   * O autor do chamado é notificado por email automaticamente.
   *
   * @param id      Identificador do chamado
   * @param request Novo status e observação opcional
   * @returns Chamado atualizado
   */
  atualizarStatus(id: string, request: AtualizarStatusChamadoRequest): Observable<ChamadoSuporteResponse> {
    return this.http.patch<ChamadoSuporteResponse>(`${this.apiUrl}/${id}/status`, request);
  }

  /**
   * Exclui um chamado da organização atual.
   *
   * @param id Identificador do chamado
   */
  deletar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
