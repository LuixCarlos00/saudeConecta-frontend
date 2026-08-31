import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EspecialidadeResponse {
  id: number;
  nome: string;
  tipoProfissional: string;
  tipoProfissionalCodigo: string;
}

@Injectable({
  providedIn: 'root'
})
export class EspecialidadeApiService {
  private readonly apiUrl = `${environment.apiUrl}/especialidades`;

  constructor(private http: HttpClient) { }

  listarTodas(): Observable<EspecialidadeResponse[]> {
    return this.http.get<EspecialidadeResponse[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<EspecialidadeResponse> {
    return this.http.get<EspecialidadeResponse>(`${this.apiUrl}/${id}`);
  }

  carregarEspecialidades(): Observable<EspecialidadeResponse[]> {
    return this.http.get<EspecialidadeResponse[]>(`${this.apiUrl}/carregarEspecialidades`);
  }

  listarOdontologicas(): Observable<EspecialidadeResponse[]> {
    return this.http.get<EspecialidadeResponse[]>(`${this.apiUrl}/odontologicas`);
  }

  listarPorTipo(codigo: string): Observable<EspecialidadeResponse[]> {
    return this.http.get<EspecialidadeResponse[]>(`${this.apiUrl}/tipo/${codigo}`);
  }

  listarPorTipoId(tipoId: number): Observable<EspecialidadeResponse[]> {
    return this.http.get<EspecialidadeResponse[]>(`${this.apiUrl}/tipo-id/${tipoId}`);
  }
}
