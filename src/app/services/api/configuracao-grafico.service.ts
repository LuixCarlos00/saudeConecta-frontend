import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ConfiguracaoGraficoResponse {
  id: number;
  tipoGrafico: string;
  descricao: string;
  ativo: boolean;
  ordemExibicao: number;
}

export interface AtualizarConfiguracaoGraficoRequest {
  tipoGrafico: string;
  ativo: boolean;
  ordemExibicao?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConfiguracaoGraficoService {
  private readonly baseUrl = `${environment.apiUrl}/dashboard/configuracoes`;

  constructor(private http: HttpClient) {}

  /**
   * Lista todas as configurações de gráficos da organização
   */
  listarConfiguracoes(): Observable<ConfiguracaoGraficoResponse[]> {
    return this.http.get<ConfiguracaoGraficoResponse[]>(this.baseUrl);
  }

  /**
   * Lista apenas os gráficos ativos
   */
  listarGraficosAtivos(): Observable<ConfiguracaoGraficoResponse[]> {
    return this.http.get<ConfiguracaoGraficoResponse[]>(`${this.baseUrl}/ativos`);
  }

  /**
   * Atualiza uma configuração específica
   */
  atualizarConfiguracao(id: number, request: AtualizarConfiguracaoGraficoRequest): Observable<ConfiguracaoGraficoResponse> {
    return this.http.put<ConfiguracaoGraficoResponse>(`${this.baseUrl}/${id}`, request);
  }

  /**
   * Atualiza múltiplas configurações de uma vez
   */
  atualizarMultiplasConfiguracoes(requests: AtualizarConfiguracaoGraficoRequest[]): Observable<ConfiguracaoGraficoResponse[]> {
    return this.http.put<ConfiguracaoGraficoResponse[]>(`${this.baseUrl}/batch`, requests);
  }

  /**
   * Reseta todas as configurações para o padrão (todos ativos)
   */
  resetarConfiguracoesParaPadrao(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/resetar`, {});
  }

  /**
   * Inicializa configurações para primeiro acesso (todos desativados)
   */
  inicializarConfiguracoes(): Observable<ConfiguracaoGraficoResponse[]> {
    return this.http.post<ConfiguracaoGraficoResponse[]>(`${this.baseUrl}/inicializar`, {});
  }
}
