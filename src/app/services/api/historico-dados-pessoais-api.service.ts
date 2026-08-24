import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HistoricoDadosPessoais } from 'src/app/util/variados/interfaces/historico-dados-pessoais/historico-dados-pessoais';

@Injectable({
  providedIn: 'root'
})
export class HistoricoDadosPessoaisApiService {

  private readonly apiUrl = `${environment.apiUrl}/historico-dados-pessoais`;

  constructor(private http: HttpClient) { }

  buscarHistoricoRecentes(): Observable<HistoricoDadosPessoais[]> {
    return this.http.get<HistoricoDadosPessoais[]>(`${this.apiUrl}/recentes`);
  }

  buscarHistoricoPorUsuario(idUsuario: number): Observable<HistoricoDadosPessoais[]> {
    return this.http.get<HistoricoDadosPessoais[]>(`${this.apiUrl}/usuario/${idUsuario}`);
  }

  buscarHistoricoPorEntidade(entidade: string, idEntidade: number): Observable<HistoricoDadosPessoais[]> {
    return this.http.get<HistoricoDadosPessoais[]>(`${this.apiUrl}/entidade/${entidade}/${idEntidade}`);
  }
}
