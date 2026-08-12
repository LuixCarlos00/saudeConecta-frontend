import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  FiltroRelatorio,
  PacienteAtendido,
  TipoDocumentoOpcao
} from 'src/app/util/variados/interfaces/relatorio/relatorio-paciente';
import { environment } from 'src/environments/environment';

/**
 * Consome os endpoints de relatorios dos pacientes.
 *
 * O backend restringe automaticamente os dados de usuarios clinicos aos seus
 * proprios atendimentos, portanto o filtro de profissional so tem efeito para
 * perfis administrativos.
 */
@Injectable({
  providedIn: 'root'
})
export class RelatorioApiService {

  private readonly apiUrl = `${environment.apiUrl}/relatorios`;

  constructor(private http: HttpClient) { }

  /**
   * Busca os pacientes atendidos com as consultas e documentos disponiveis.
   *
   * @param filtro filtros opcionais de profissional, texto e periodo
   * @returns lista de pacientes ordenada pelo atendimento mais recente
   */
  buscarPacientesAtendidos(filtro: FiltroRelatorio = {}): Observable<PacienteAtendido[]> {
    let params = new HttpParams();

    if (filtro.profissionalId) {
      params = params.set('profissionalId', filtro.profissionalId);
    }
    if (filtro.termo?.trim()) {
      params = params.set('termo', filtro.termo.trim());
    }
    if (filtro.dataInicio) {
      params = params.set('dataInicio', filtro.dataInicio);
    }
    if (filtro.dataFim) {
      params = params.set('dataFim', filtro.dataFim);
    }

    return this.http.get<PacienteAtendido[]>(`${this.apiUrl}/pacientes`, { params });
  }

  /**
   * Busca os relatorios de um paciente especifico.
   *
   * @param pacienteId identificador do paciente
   * @returns paciente com consultas e documentos
   */
  buscarRelatoriosDoPaciente(pacienteId: number): Observable<PacienteAtendido> {
    return this.http.get<PacienteAtendido>(`${this.apiUrl}/pacientes/${pacienteId}`);
  }

  /**
   * Busca os tipos de documento suportados pelo backend.
   *
   * @returns tipos com codigo, rotulo e descricao
   */
  buscarTiposDocumento(): Observable<TipoDocumentoOpcao[]> {
    return this.http.get<TipoDocumentoOpcao[]>(`${this.apiUrl}/tipos-documento`);
  }
}
