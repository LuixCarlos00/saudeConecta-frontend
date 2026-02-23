import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiUrlService } from '../../services/api/api-url.service';
import {
  ConfiguracaoGraficoDashboard,
  AtualizarConfiguracaoGraficoRequest
} from '../../shared/models/configuracao-grafico-dashboard.interface';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracaoGraficoDashboardService {
  private readonly apiUrl = `${environment.apiUrl}/dashboard/configuracoes`;
  private readonly baseUrl = `${this.apiUrl}`;

  constructor(
    private http: HttpClient,
    private apiUrlService: ApiUrlService
  ) {
   }

  listarConfiguracoes(): Observable<ConfiguracaoGraficoDashboard[]> {
    return this.http.get<ConfiguracaoGraficoDashboard[]>(this.baseUrl);
  }

  listarGraficosAtivos(): Observable<ConfiguracaoGraficoDashboard[]> {
    return this.http.get<ConfiguracaoGraficoDashboard[]>(`${this.baseUrl}/ativos`);
  }

  atualizarConfiguracao(
    id: number,
    request: AtualizarConfiguracaoGraficoRequest
  ): Observable<ConfiguracaoGraficoDashboard> {
    return this.http.put<ConfiguracaoGraficoDashboard>(`${this.baseUrl}/${id}`, request);
  }

  atualizarMultiplasConfiguracoes(
    requests: AtualizarConfiguracaoGraficoRequest[]
  ): Observable<ConfiguracaoGraficoDashboard[]> {
    return this.http.put<ConfiguracaoGraficoDashboard[]>(`${this.baseUrl}/batch`, requests);
  }

  resetarConfiguracoesParaPadrao(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/resetar`, {});
  }
}
