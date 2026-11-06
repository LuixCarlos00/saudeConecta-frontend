import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QuestionarioPublicoApiService {

  private readonly apiUrl = `${environment.apiUrl}/publico`;

  constructor(private http: HttpClient) { }

  // ── Questionário de Saúde ──────────────────────────────────────────────────

  buscarQuestionario(token: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/questionario/${token}`);
  }

  responderQuestionario(payload: { token: string; respostasQuestionario: string; assinaturaBase64: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/questionario/responder`, payload);
  }

  // ── Assinatura do Planejamento Terapêutico ─────────────────────────────────

  buscarPlanejamento(token: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/planejamento/${token}`);
  }

  assinarPlanejamento(payload: { token: string; assinaturaBase64: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/planejamento/assinar`, payload);
  }
}
