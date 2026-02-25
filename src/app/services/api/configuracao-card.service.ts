import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ConfiguracaoCardResponse {
  id: number;
  tipoCard: string;
  descricao: string;
  ativo: boolean;
  ordemExibicao: number;
}

export interface AtualizarConfiguracaoCardRequest {
  tipoCard: string;
  ativo: boolean;
  ordemExibicao?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConfiguracaoCardService {

  private readonly baseUrl = `${environment.apiUrl}/dashboard/configuracoes-cards`;

  constructor(private http: HttpClient) {}

  /**
   * Lista todas as configurações de cards do usuário logado
   */
  listarConfiguracoes(): Observable<ConfiguracaoCardResponse[]> {
    return this.http.get<ConfiguracaoCardResponse[]>(this.baseUrl);
  }

  /**
   * Lista apenas os cards ativos do usuário logado
   */
  listarCardsAtivos(): Observable<ConfiguracaoCardResponse[]> {
    return this.http.get<ConfiguracaoCardResponse[]>(`${this.baseUrl}/ativos`);
  }

  /**
   * Atualiza uma configuração de card específica
   */
  atualizarConfiguracao(id: number, request: AtualizarConfiguracaoCardRequest): Observable<ConfiguracaoCardResponse> {
    return this.http.put<ConfiguracaoCardResponse>(`${this.baseUrl}/${id}`, request);
  }

  /**
   * Atualiza múltiplas configurações de uma vez
   */
  atualizarMultiplasConfiguracoes(requests: AtualizarConfiguracaoCardRequest[]): Observable<ConfiguracaoCardResponse[]> {
    return this.http.put<ConfiguracaoCardResponse[]>(`${this.baseUrl}/batch`, requests);
  }

  /**
   * Reseta todas as configurações para o padrão (todos ativos)
   */
  resetarConfiguracoesParaPadrao(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/resetar`, {});
  }

  /**
   * Inicializa configurações para primeiro acesso
   */
  inicializarConfiguracoes(): Observable<ConfiguracaoCardResponse[]> {
    return this.http.post<ConfiguracaoCardResponse[]>(`${this.baseUrl}/inicializar`, {});
  }
}
