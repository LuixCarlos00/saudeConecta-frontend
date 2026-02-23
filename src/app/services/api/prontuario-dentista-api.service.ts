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


  /**
   * Busca o prontuário odontológico mais recente pelo ID da consulta.
   * Usado em AbrirOpcoesImpressao junto com buscarProntuarioById do serviço médico.
   */
  buscarProntuarioDentistaById(consultaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/consulta/${consultaId}/recente`);
  }

  listarPorConsulta(consultaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/consulta/${consultaId}`);
  }

  listarPorProfissional(profissionalId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/profissional/${profissionalId}`);
  }



}
