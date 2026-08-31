import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ConfiguracoesConsulta {
  id?: number;
  organizacaoId?: number;
  pularParaAgendado: boolean;
  descricao: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfiguracoesConsultaApiService {

  private readonly apiUrl = `${environment.apiUrl}/configuracoes-consulta`;

  constructor(private http: HttpClient) { }

  buscarConfiguracaoAtual(): Observable<ConfiguracoesConsulta> {
    return this.http.get<ConfiguracoesConsulta>(`${this.apiUrl}/atual`);
  }

  buscarConfiguracaoPorOrganizacao(organizacaoId: number): Observable<ConfiguracoesConsulta> {
    return this.http.get<ConfiguracoesConsulta>(`${this.apiUrl}/organizacao/${organizacaoId}`);
  }

  criarConfiguracao(organizacaoId: number, configuracao: ConfiguracoesConsulta): Observable<ConfiguracoesConsulta> {
    return this.http.post<ConfiguracoesConsulta>(`${this.apiUrl}/organizacao/${organizacaoId}`, configuracao);
  }

  atualizarConfiguracao(id: number, configuracao: ConfiguracoesConsulta): Observable<ConfiguracoesConsulta> {
    return this.http.put<ConfiguracoesConsulta>(`${this.apiUrl}/${id}`, configuracao);
  }

  atualizarConfiguracaoAtual(configuracao: ConfiguracoesConsulta): Observable<ConfiguracoesConsulta> {
    return this.http.put<ConfiguracoesConsulta>(`${this.apiUrl}/atual`, configuracao);
  }

  devePularParaAgendado(): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/deve-pular-agendado`);
  }
}
