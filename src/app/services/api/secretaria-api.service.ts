import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Secretaria {
  secCodigo?: number;
  secNome?: string;
  secCpf?: string;
  secRg?: string;
  secTelefone?: string;
  secEmail?: string;
  secDataNascimento?: string;
  secEndereco?: number;
  secUsuario?: number;
}

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



  listarTodos(): Observable<Secretaria[]> {
    return this.http.get<Secretaria[]>(`${this.apiUrl}/listarTodos`);
  }



  atualizarSecretariaIdByOrg(id: number, secretaria: Secretaria): Observable<Secretaria> {
    return this.http.put<Secretaria>(`${this.apiUrl}/atualizarSecretariaIdByOrg/${id}`, secretaria);
  }
}
