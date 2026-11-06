import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ConfiguracoesConsulta {
  id?: number;
  organizacaoId?: number;
  pularParaConfirmado: boolean;
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

  atualizarConfiguracaoAtual(configuracao: ConfiguracoesConsulta): Observable<ConfiguracoesConsulta> {
    return this.http.put<ConfiguracoesConsulta>(`${this.apiUrl}/atual`, configuracao);
  }

}
