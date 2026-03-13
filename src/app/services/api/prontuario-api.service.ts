import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Prontuario } from 'src/app/util/variados/interfaces/Prontuario/Prontuario';
import { environment } from 'src/environments/environment';



@Injectable({
  providedIn: 'root'
})
export class ProntuarioApiService {

  private readonly apiUrl = `${environment.apiUrl}/prontuario`;

  constructor(private http: HttpClient) { }



  cadastrarProntuarioMedico(prontuario: Prontuario): Observable<Prontuario> {
    return this.http.post<Prontuario>(`${this.apiUrl}/cadastrarProntuarioMedico`, prontuario);
  }

  buscarPorId(id: number): Observable<Prontuario> {
    return this.http.get<Prontuario>(`${this.apiUrl}/buscarId/${id}`);
  }

  buscarProntuarioById(id: number) {
    return this.http.get<Prontuario>(`${this.apiUrl}/buscarProntuarioById/${id}`);
  }

}
