import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Secretaria } from 'src/app/util/variados/interfaces/secretaria/secretaria';
import { environment } from 'src/environments/environment';



@Injectable({
  providedIn: 'root'
})
export class SecretariaApiService {

  private readonly apiUrl = `${environment.apiUrl}/secretaria`;

  constructor(private http: HttpClient) { }

  cadastrarSecretariaByOrg(secretaria: any): Observable<Secretaria> {
    return this.http.post<Secretaria>(`${this.apiUrl}/cadastrarSecretariaByOrg`, secretaria);
  }

  buscarSecretariaIdByOrg(id: number): Observable<Secretaria> {
    return this.http.get<Secretaria>(`${this.apiUrl}/buscarSecretariaIdByOrg/${id}`);
  }


  deletarSecretariaIdByOrg(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deletarSecretariaIdByOrg/${id}`);
  }

  atualizarSecretariaIdByOrg(id: number, secretaria: Secretaria): Observable<Secretaria> {
    return this.http.put<Secretaria>(`${this.apiUrl}/atualizarSecretariaIdByOrg/${id}`, secretaria);
  }
}
