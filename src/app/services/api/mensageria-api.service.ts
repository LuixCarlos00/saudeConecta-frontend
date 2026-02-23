import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type StatusMensagem = 'PENDENTE' | 'ENVIADO' | 'FALHOU' | 'RENOTIFICADO';
export type TipoMensagem =
  | 'EMAIL_CREDENCIAIS_CLINICO'
  | 'EMAIL_CREDENCIAIS_SECRETARIA'
  | 'EMAIL_CREDENCIAIS_ADMINISTRADOR'
  | 'EMAIL_RECUPERACAO_SENHA'
  | 'EMAIL_GENERICO';

export interface MensageriaResponse {
  id: number;
  organizacaoId: number;
  destinatarioProfissionalId: number | null;
  destinatarioProfissionalNome: string | null;
  destinatarioEmail: string;
  destinatarioNome: string;
  assunto: string;
  corpoMensagem: string;
  tipoMensagem: TipoMensagem;
  status: StatusMensagem;
  erroDetalhe: string | null;
  tentativas: number;
  adminNotificado: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MensageriaApiService {

  private readonly apiUrl = `${environment.apiUrl}/mensageria`;

  constructor(private http: HttpClient) {}

  /**
   * Lista mensagens com paginação e filtros opcionais.
   *
   * @param status Filtro por status
   * @param tipo   Filtro por tipo de mensagem
   * @param page   Número da página
   * @param size   Tamanho da página
   */
  listarMensagens(
    status?: StatusMensagem,
    tipo?: TipoMensagem,
    page = 0,
    size = 20
  ): Observable<PageResponse<MensageriaResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) params = params.set('status', status);
    if (tipo) params = params.set('tipo', tipo);

    return this.http.get<PageResponse<MensageriaResponse>>(this.apiUrl, { params });
  }

  /**
   * Busca uma mensagem específica por ID.
   *
   * @param id ID da mensagem
   */
  buscarPorId(id: number): Observable<MensageriaResponse> {
    return this.http.get<MensageriaResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Lista mensagens com falha ainda não notificadas ao administrador.
   */
  listarFalhasPendentes(): Observable<MensageriaResponse[]> {
    return this.http.get<MensageriaResponse[]>(`${this.apiUrl}/falhas-pendentes`);
  }

  /**
   * Retorna a contagem de falhas pendentes de notificação.
   */
  contarFalhasPendentes(): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.apiUrl}/contagem-falhas`);
  }

  /**
   * Marca uma mensagem como notificada ao administrador.
   *
   * @param id ID da mensagem
   */
  marcarComoNotificado(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/notificar`, {});
  }
}
