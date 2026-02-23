import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Administrador {
  admCodigo?: number;
  admNome?: string;
  admCpf?: string;
  admRg?: string;
  admTelefone?: string;
  admEmail?: string;
  admDataNascimento?: string;
  admEndereco?: number;
  admUsuario?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdministradorApiService {

  private readonly apiUrl = `${environment.apiUrl}/administrador`;

  constructor(private http: HttpClient) { }

  cadastrarAdminByOrg(administrador: any): Observable<Administrador> {
    return this.http.post<Administrador>(`${this.apiUrl}/cadastrarAdminByOrg`, administrador);
  }



  buscarrAdminByOrg(id: number): Observable<Administrador> {
    return this.http.get<Administrador>(`${this.apiUrl}/buscarrAdminByOrg/${id}`);
  }

  atualizarAdmByOrg(id: number, administrador: Administrador): Observable<Administrador> {
    return this.http.put<Administrador>(`${this.apiUrl}/atualizarAdmByOrg/${id}`, administrador);
  }



  deletarAdmByOrg(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deletarAdmByOrg/${id}`);
  }








  buscarPorEmail(email: string): Observable<Administrador> {
    return this.http.get<Administrador>(`${this.apiUrl}/buscarPorEmail/${email}`);
  }


  confirmarCodigoSeguranca(codigo: string): Observable<Administrador> {
    return this.http.get<Administrador>(`${this.apiUrl}/verificarCodigo/${codigo}`);
  }

  obterCodigoRecuperacao(email: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/obterCodigoRecuperacao/${email}`);
  }


}
