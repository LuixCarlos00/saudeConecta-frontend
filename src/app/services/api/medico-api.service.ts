import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Medico {
  medCodigo?: number;
  medNome?: string;
  medCpf?: string;
  medRg?: string;
  medCrm?: string;
  medEspecialidade?: string;
  medTelefone?: string;
  medEmail?: string;
  medDataNascimento?: string;
  medEndereco?: number;
  medUsuario?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MedicoApiService {

  private readonly apiUrl = `${environment.apiUrl}/medico`;

  // ==========================================
  // STATE MANAGEMENT (migrado de MedicosService legado)
  // ==========================================
  private medicoSubject = new BehaviorSubject<Medico[]>([]);
  MedicoValue$ = this.medicoSubject.asObservable();

  constructor(private http: HttpClient) { }

  private emitMedicosChange(medicos: Medico[]): void {
    this.medicoSubject.next(medicos);
  }

  LimparDadosPesquisa(): void {
    this.emitMedicosChange([]);
  }

  changeMedicoData(medicos: Medico[]): void {
    this.emitMedicosChange(medicos);
  }

  //

  buscarTodos(): Observable<Medico[]> {
    return this.http.get<Medico[]>(`${this.apiUrl}/listarTodos`);
  }

  buscarPorOrganizacao(organizacaoId: number): Observable<Medico[]> {
    return this.http.get<Medico[]>(`${environment.apiUrl}/profissionais/organizacao/${organizacaoId}`);
  }


}
