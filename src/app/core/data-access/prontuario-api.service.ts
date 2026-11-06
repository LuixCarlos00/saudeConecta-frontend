import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Prontuario } from 'src/app/shared/models/Prontuario';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProntuarioApiService {

  private readonly apiUrl = `${environment.apiUrl}/prontuario`;

  constructor(private http: HttpClient) { }

  cadastrarProntuarioMedico(prontuario: any): Observable<Prontuario> {
    return this.http.post<Prontuario>(`${this.apiUrl}/cadastrarProntuarioMedico`, prontuario);
  }



  atualizarProntuarioMedico(id: number, prontuario: any): Observable<Prontuario> {
    return this.http.put<Prontuario>(`${this.apiUrl}/atualizarProntuarioMedico/${id}`, prontuario);
  }


  buscarProntuarioById(consultaId: number): Observable<Prontuario> {
    return this.http.get<Prontuario>(`${this.apiUrl}/buscarProntuarioById/${consultaId}`);
  }

  buscarMaisRecentePorConsulta(consultaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/consulta/${consultaId}/recente`);
  }

}
