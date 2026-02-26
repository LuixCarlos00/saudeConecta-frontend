import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProntuarioDentistaRequest } from 'src/app/util/variados/interfaces/Prontuario/ProntuarioDentista';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProntuarioDentistaApiService {

  private readonly apiUrl = `${environment.apiUrl}/prontuario-dentista`;

  constructor(private http: HttpClient) { }

  cadastrarProntuarioByOrg(payload: ProntuarioDentistaRequest) {
    return this.http.post(`${this.apiUrl}/cadastrarProntuarioByOrg`, payload);
  }

  buscarProntuarioDentistaById(consultaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/consulta/${consultaId}/recente`);
  }

  gerarLinkQuestionario(consultaId: number): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/gerar-link-questionario/${consultaId}`, {});
  }

  buscarQuestionarioSaude(consultaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/questionario-saude/${consultaId}`);
  }

  listarHistoricoPorPaciente(pacienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/paciente/${pacienteId}`);
  }
}
