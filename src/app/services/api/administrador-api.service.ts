import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Administrador } from 'src/app/util/variados/interfaces/administrado/adiministrador';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AdministradorApiService {

  private readonly apiUrl = `${environment.apiUrl}/administrador`;

  constructor(private http: HttpClient) { }


  cadastrarAdminOrgCompleto(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/cadastrarAdminOrgCompleto`, payload);
  }

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
}
