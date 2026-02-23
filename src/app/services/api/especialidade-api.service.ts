import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Especialidade } from 'src/app/util/variados/interfaces/especialidade/especialidade';

@Injectable({
  providedIn: 'root'
})
export class EspecialidadeApiService {
  private readonly apiUrl = `${environment.apiUrl}/especialidades`;

  constructor(private http: HttpClient) {}

  listarAtivas(): Observable<Especialidade[]> {
    return this.http.get<Especialidade[]>(`${this.apiUrl}`);
  }

  buscarPorId(id: number): Observable<Especialidade> {
    return this.http.get<Especialidade>(`${this.apiUrl}/${id}`);
  }

  listarMedicas(): Observable<Especialidade[]> {
    return this.http.get<Especialidade[]>(`${this.apiUrl}/medicas`);
  }

  listarOdontologicas(): Observable<Especialidade[]> {
    return this.http.get<Especialidade[]>(`${this.apiUrl}/odontologicas`);
  }

  listarPorTipoCodigo(codigo: string): Observable<Especialidade[]> {
    return this.http.get<Especialidade[]>(`${this.apiUrl}/tipo/${codigo}`);
  }

  listarPorTipoId(tipoId: number): Observable<Especialidade[]> {
    return this.http.get<Especialidade[]>(`${this.apiUrl}/tipo-id/${tipoId}`);
  }
}
