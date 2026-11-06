import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlanejamentoTerapeuticoApiService {

  private readonly apiUrl = `${environment.apiUrl}/planejamento-terapeutico`;

  constructor(private http: HttpClient) { }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  gerarLinkAssinatura(prontuarioId: number, tipo: string = 'DENTISTA'): Observable<{ token: string }> {
    const params = new HttpParams().set('tipo', tipo);
    return this.http.post<{ token: string }>(`${this.apiUrl}/gerar-link/${prontuarioId}`, {}, { params });
  }
}
