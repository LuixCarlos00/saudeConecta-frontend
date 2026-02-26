import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProcedimentoPadraoApiService {

  private readonly apiUrl = `${environment.apiUrl}/procedimentos-padrao`;

  constructor(private http: HttpClient) { }

  listarPorProfissional(profissionalId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/profissional/${profissionalId}`);
  }

  criar(profissionalId: number, payload: { nomeProcedimento: string; valorPadrao?: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/profissional/${profissionalId}`, payload);
  }

  atualizar(id: number, payload: { nomeProcedimento: string; valorPadrao?: number }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }

  desativar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
