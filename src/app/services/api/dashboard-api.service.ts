import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * DTO retornado pelo backend com as estatísticas do dashboard do AdminOrg.
 * Calculado a partir de uma única query agrupada por status e período.
 */
export interface EstatisticasDashboardAdminOrg {
  consultasHoje: number;
  consultasAguardando: number;
  consultasAtendidas: number;
  consultasSemana: number;
  canceladosSemana: number;
  confirmadosSemana: number;
}

/**
 * Estatísticas exibidas no dashboard após tratamento no frontend.
 * Inclui médicos ativos que vem de requisição separada.
 */
export interface DashboardAdminOrgStats {
  consultasHoje: number;
  consultasAguardando: number;
  consultasAtendidas: number;
  consultasSemana: number;
  canceladosSemana: number;
  confirmadosSemana: number;
  medicosAtivos: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardApiService {

  private readonly apiUrl = `${environment.apiUrl}/consultas`;

  constructor(private http: HttpClient) {}

  /**
   * Busca todas as estatísticas de consultas do dashboard para AdminOrg.
   * Uma única requisição ao backend que agrupa por status e período (hoje vs semana).
   *
   * @param organizacaoId ID da organização
   * @returns Observable com o DTO completo de estatísticas
   */
  getEstatisticasDashboardAdminOrg(organizacaoId: number): Observable<EstatisticasDashboardAdminOrg> {
    return this.http.get<EstatisticasDashboardAdminOrg>(
      `${this.apiUrl}/estatisticas/organizacao/${organizacaoId}/dashboard`
    );
  }

  /**
   * Busca todas as estatísticas de consultas do dashboard para o Profissional.
   * Uma única requisição filtrada por usuarioId via JOIN com profissional.
   *
   * @param usuarioId ID do usuário logado
   * @returns Observable com o DTO completo de estatísticas
   */
  getEstatisticasDashboardProfissional(usuarioId: number): Observable<EstatisticasDashboardAdminOrg> {
    return this.http.get<EstatisticasDashboardAdminOrg>(
      `${this.apiUrl}/estatisticas/dashboard/profissional`,
      { params: { usuarioId: usuarioId.toString() } }
    );
  }

  /**
   * Busca todas as estatísticas de consultas do dashboard para SuperAdmin.
   * Uma única requisição global, sem filtro de organização.
   *
   * @returns Observable com o DTO completo de estatísticas
   */
  getEstatisticasDashboardSuperAdmin(): Observable<EstatisticasDashboardAdminOrg> {
    return this.http.get<EstatisticasDashboardAdminOrg>(
      `${this.apiUrl}/estatisticas/dashboard/super-admin`
    );
  }
}
