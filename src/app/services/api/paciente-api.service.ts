import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Paciente } from 'src/app/util/variados/interfaces/paciente/paciente';
import { environment } from 'src/environments/environment';



@Injectable({
  providedIn: 'root'
})
export class PacienteApiService {

  private readonly apiUrl = `${environment.apiUrl}/pacientes`;


  public TodosPacientes: Paciente[] = [];
  public MostraCamposDePEsquisa: boolean = false;

  constructor(private http: HttpClient) { }


  cadastrarPacientebyOrg(paciente: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/cadastrarPacientebyOrg`, paciente);
  }

  buscarrPacientebyOrg(id: number): Observable<Paciente> {
    return this.http.get<Paciente>(`${this.apiUrl}/buscarrPacientebyOrg/${id}`);
  }


  atualizarPacientebyOrg(id: number, paciente: Paciente): Observable<Paciente> {
    return this.http.put<Paciente>(`${this.apiUrl}/atualizarPacientebyOrg/${id}`, paciente);
  }


  deletarPacienteByOrg(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deletarPacientebyOrg/${id}`);
  }

  bloquearPacientebyOrg(bloquearUsuarioRequest: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/bloquearPacientebyOrg`, bloquearUsuarioRequest);
  }


  // ==========================================
  // PESQUISA COM FILTRO DINÂMICO
  // ==========================================

  pesquisarComFiltro(options: number, pesquisa: string, filtro: string): Observable<Paciente[]> {
    const metodosBusca: { [key: number]: () => Observable<Paciente[]> } = {
      1: () => this.buscarPorNome(pesquisa, filtro),
      2: () => this.buscarPorCPF(pesquisa, filtro),
      3: () => this.buscarPorRG(pesquisa, filtro),
      4: () => this.buscarPorTelefone(pesquisa, filtro),
      5: () => this.buscarTodos(filtro),
    };

    const metodo = metodosBusca[options];
    if (!metodo) {
      throw new Error('Filtro de pesquisa inválido.');
    }
    return metodo();
  }

  buscarTodos(filtro: string = 'ALL'): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(`${this.apiUrl}/buscar-todos?filtro=${filtro}`);
  }

  buscarPorNome(nome: string, filtro: string = 'ALL'): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(`${this.apiUrl}/buscar-por-nome?nome=${nome}&filtro=${filtro}`);
  }

  buscarPorCPF(cpf: string, filtro: string = 'ALL'): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(`${this.apiUrl}/buscar-por-cpf?cpf=${cpf}&filtro=${filtro}`);
  }

  buscarPorRG(rg: string, filtro: string = 'ALL'): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(`${this.apiUrl}/buscar-por-rg?rg=${rg}&filtro=${filtro}`);
  }

  buscarPorTelefone(telefone: string, filtro: string = 'ALL'): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(`${this.apiUrl}/buscar-por-telefone?telefone=${telefone}&filtro=${filtro}`);
  }

  // ==========================================
  //===========================================
  // ==========================================


}
