import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Profissional } from 'src/app/util/variados/interfaces/medico/Profissional';
import { environment } from 'src/environments/environment';



@Injectable({
  providedIn: 'root'
})
export class ProfissionalApiService {
 

  private readonly apiUrl = `${environment.apiUrl}/profissionais`;

  private profissionalSubject = new BehaviorSubject<Profissional[]>([]);
  ProfissionalValue$ = this.profissionalSubject.asObservable();

  constructor(private http: HttpClient) { }

  private emitProfissionaisChange(profissionais: Profissional[]): void {
    this.profissionalSubject.next(profissionais);
  }

  LimparDadosPesquisa(): void {
    this.emitProfissionaisChange([]);
  }

  changeProfissionalData(profissionais: Profissional[]): void {
    this.emitProfissionaisChange(profissionais);
  }




  // ==========================================
  // CRUD - NOVOS ENDPOINTS
  // ==========================================

  cadastraClinicoByOrg(profissional: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/cadastraClinicoByOrg`, profissional);
  }

  atualizarClinicoIdByOrg(id: number, profissional: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/atualizarClinicoIdByOrg/${id}`, profissional);
  }

  deletarClinicoIdByOrg(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deletarClinicoIdByOrg/${id}`);
  }


  buscarClinicoIdByOrg(id: number): Observable<Profissional> {
    return this.http.get<Profissional>(`${this.apiUrl}/buscarClinicoIdByOrg/${id}`);
  }

  buscarTodosClinicosByOrg(): Observable<Profissional[]> {
    return this.http.get<Profissional[]>(`${this.apiUrl}`);
  }

  buscarPorOrganizacao(organizcaoId: number): Observable<Profissional[]> {
    return this.http.get<Profissional[]>(`${environment.apiUrl}/profissionais/organizacao/${organizcaoId}`);
  }

  // ==========================================
  // PESQUISA COM FILTRO DINÂMICO
  // ==========================================

  pesquisarComFiltro(option: number, pesquisa: string, filtro: string): Observable<any[]> {
    const metodosBusca: { [key: number]: () => Observable<any[]> } = {
      1: () => this.buscarPorNome(pesquisa, filtro),
      2: () => this.buscarPorCRM(pesquisa, filtro),
      3: () => this.buscarPorCidade(pesquisa, filtro),
      4: () => this.buscarPorEspecialidade(pesquisa, filtro),
      5: () => this.buscarTodos(filtro),
    };

    const metodo = metodosBusca[option];
    if (!metodo) {
      throw new Error('Filtro de pesquisa inválido.');
    }
    return metodo();
  }

  buscarPorCRM(crm: string, filtro: string = 'ALL'): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/buscar-por-crm`, { params: { crm, filtro } });
  }

  buscarPorCidade(cidade: string, filtro: string = 'ALL'): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/buscar-por-cidade`, { params: { cidade, filtro } });
  }

  buscarPorEspecialidade(especialidade: string, filtro: string = 'ALL'): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/buscar-por-especialidade`, { params: { especialidade, filtro } });
  }

  buscarPorNome(nome: string, filtro: string = 'ALL'): Observable<Profissional[]> {
    return this.http.get<Profissional[]>(`${this.apiUrl}/buscar-por-nome`, { params: { nome, filtro } });
  }

  buscarTodos(filtro: string = 'ALL'): Observable<Profissional[]> {
    return this.http.get<Profissional[]>(`${this.apiUrl}`, { params: { filtro } });
  }


  //=============================================================
  // BUSCAS DE ESTATISTICAS - Dashboard - Admin_ORGANIZACAO
  //=============================================================

  getEstatisticasMedicosAtivosByOrg(organizacaoId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/organizacao/${organizacaoId}/medicos-ativos`);
  }

  //=============================================================
  // BUSCAS DE ESTATISTICAS - Dashboard - SUPER_ADMIN (global)
  //=============================================================

  getEstatisticasMedicosAtivosGlobal(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estatisticas/medicos-ativos`);
  }

}
