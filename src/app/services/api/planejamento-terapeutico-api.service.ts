import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlanejamentoTerapeuticoApiService {

  private readonly apiUrl = `${environment.apiUrl}/planejamento-terapeutico`;

  constructor(private http: HttpClient) { }

  listarPorProntuario(prontuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/prontuario/${prontuarioId}`);
  }

  adicionar(profissionalId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/profissional/${profissionalId}`, payload);
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  gerarLinkAssinatura(prontuarioId: number): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/gerar-link/${prontuarioId}`, {});
  }
}
