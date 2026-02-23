import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Paciente {
  codigo?: number;
  nome?: string;
  cpf?: string;
  rg?: string;
  telefone?: string;
  email?: string;
  dataNascimento?: string;
  endereco?: number;
  usuario?: number;
  status?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PacienteApiService {

  private readonly apiUrl = `${environment.apiUrl}/pacientes`;

  // ==========================================
  // STATE (migrado de PacientesService legado)
  // ==========================================
  public TodosPacientes: Paciente[] = [];
  public MostraCamposDePEsquisa: boolean = false;

  constructor(private http: HttpClient) { }

  // ==========================================
  // CRUD BÁSICO
  // ==========================================

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

  // ==========================================
  // GERENCIAMENTO DE STATUS
  // ==========================================

  /**
   * Bloqueia ou desbloqueia um paciente
   * @param pacienteId ID do paciente
   * @param status 0 para bloquear, 1 para desbloquear
   * @returns Observable com a resposta da API
   */
  bloquearPacientebyOrg(bloquearUsuarioRequest: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/bloquearPacientebyOrg`, bloquearUsuarioRequest);
  }


































  /**
   * Recupera cadastro de paciente por email
   * @param email Email do paciente
   * @returns Observable com dados do paciente
   */
  recuperaCadastroPaciente(email: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/buscarPorEmail/${email}`);
  }

  // // ==========================================
  // // MÉTODOS LEGADOS (migrados de PacientesService)
  // // ==========================================

  // cadastrarPaciente(paciente: Paciente): Observable<Paciente> {
  //   return this.http.post<Paciente>(`${this.apiUrl}/post`, paciente);
  // }

  // buscarListaPacientesPorCPF(pesquisa: string): Observable<Paciente[]> {
  //   return this.http.get<Paciente[]>(`${this.apiUrl}/buscar-por-cpf/${pesquisa}`)
  //     .pipe(tap((pacientes: Paciente[]) => { this.TodosPacientes = pacientes; }));
  // }

  // buscarListaPacientesPorTelefone(pesquisa: string): Observable<Paciente[]> {
  //   return this.http.get<Paciente[]>(`${this.apiUrl}/buscar-por-telefone/${pesquisa}`)
  //     .pipe(tap((pacientes: Paciente[]) => { this.TodosPacientes = pacientes; }));
  // }

  // buscarListaPacientesPor_RG(pesquisa: string): Observable<Paciente[]> {
  //   return this.http.get<Paciente[]>(`${this.apiUrl}/buscar-por-rg/${pesquisa}`)
  //     .pipe(tap((pacientes: Paciente[]) => { this.TodosPacientes = pacientes; }));
  // }

  // buscarListaPacientesPorNome(pesquisa: string): Observable<Paciente[]> {
  //   return this.http.get<Paciente[]>(`${this.apiUrl}/buscar-por-nome/${pesquisa}`)
  //     .pipe(tap((pacientes: Paciente[]) => { this.TodosPacientes = pacientes; }));
  // }

  // buscarTodosPacientes(): Observable<Paciente[]> {
  //   return this.http.get<Paciente[]>(`${this.apiUrl}/buscar-todos`)
  //     .pipe(tap((pacientes: Paciente[]) => { this.TodosPacientes = pacientes; }));
  // }


  // PesquisarPacientesFiltro(FiltroPesquisaPaciente: number, pesquisa: string): Promise<any[]> {
  //   const searchMethods: { [key: number]: () => Observable<any[]> } = {
  //     1: () => this.buscarListaPacientesPorNome(pesquisa),
  //     2: () => this.buscarListaPacientesPorCPF(pesquisa),
  //     3: () => this.buscarListaPacientesPor_RG(pesquisa),
  //     4: () => this.buscarListaPacientesPorTelefone(pesquisa),
  //     5: () => this.buscarTodosPacientes(),
  //   };

  //   return new Promise((resolve, reject) => {
  //     try {
  //       const searchMethod = searchMethods[FiltroPesquisaPaciente];
  //       if (searchMethod) {
  //         searchMethod().subscribe(
  //           (dados) => {
  //             if (dados && dados.length > 0) {
  //               resolve(dados);
  //             } else {
  //               reject(new Error('Nenhum paciente encontrado.'));
  //             }
  //           },
  //           (error) => {
  //             reject(error);
  //           }
  //         );
  //       } else {
  //         reject(new Error('Filtro de pesquisa inválido.'));
  //       }
  //     } catch (error) {
  //       console.error(error);
  //       reject(error);
  //     }
  //   });
  // }
}
