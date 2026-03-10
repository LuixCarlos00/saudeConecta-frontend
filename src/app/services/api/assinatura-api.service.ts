import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AssinaturaTenant, AssinaturaTenantRequest, CustomizarPlanoTenantRequest, LimitesPlano } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AssinaturaApiService {

  private readonly apiUrl = `${environment.apiUrl}/assinaturas`;

  constructor(private http: HttpClient) { }

  /**
   * Cria nova assinatura (TRIAL) para a organização.
   * @param request dados da assinatura
   * @returns Observable com a assinatura criada
   */
  assinar(request: AssinaturaTenantRequest): Observable<AssinaturaTenant> {
    return this.http.post<AssinaturaTenant>(this.apiUrl, request);
  }

  /**
   * Associa um plano a uma organização (SUPER_ADMIN).
   * @param organizacaoId ID da organização
   * @param planoId ID do plano
   * @returns Observable com a assinatura criada
   */
  assinarPlano(organizacaoId: number, planoId: number): Observable<AssinaturaTenant> {
    return this.http.post<AssinaturaTenant>(`${this.apiUrl}/organizacao/${organizacaoId}/plano/${planoId}`, {});
  }

  /**
   * Troca o plano da assinatura ativa.
   * @param novoPlanoId ID do novo plano
   * @returns Observable com a assinatura atualizada
   */
  trocarPlano(novoPlanoId: number): Observable<AssinaturaTenant> {
    return this.http.put<AssinaturaTenant>(`${this.apiUrl}/trocar-plano/${novoPlanoId}`, {});
  }

  /**
   * Busca a assinatura ativa da organização do usuário logado.
   * @returns Observable com a assinatura ativa
   */
  minhaAssinatura(): Observable<AssinaturaTenant> {
    return this.http.get<AssinaturaTenant>(`${this.apiUrl}/minha-assinatura`);
  }

  /**
   * Retorna os limites de uso do plano da organização.
   * @returns Observable com os limites do plano
   */
  obterLimites(): Observable<LimitesPlano> {
    return this.http.get<LimitesPlano>(`${this.apiUrl}/limites`);
  }

  /**
   * Lista todas as assinaturas (SUPER_ADMIN).
   * @returns Observable com lista de assinaturas
   */
  listarTodas(): Observable<AssinaturaTenant[]> {
    return this.http.get<AssinaturaTenant[]>(this.apiUrl);
  }

  /**
   * Lista assinaturas de uma organização específica (SUPER_ADMIN).
   * @param organizacaoId ID da organização
   * @returns Observable com lista de assinaturas
   */
  listarPorOrganizacao(organizacaoId: number): Observable<AssinaturaTenant[]> {
    return this.http.get<AssinaturaTenant[]>(`${this.apiUrl}/organizacao/${organizacaoId}`);
  }

  /**
   * Customiza os limites do plano para um tenant específico (SUPER_ADMIN).
   * @param organizacaoId ID da organização
   * @param request limites customizados
   * @returns Observable com a assinatura atualizada
   */
  customizarPlano(organizacaoId: number, request: CustomizarPlanoTenantRequest): Observable<AssinaturaTenant> {
    return this.http.put<AssinaturaTenant>(`${this.apiUrl}/organizacao/${organizacaoId}/customizar`, request);
  }

  /**
   * Suspende uma assinatura (SUPER_ADMIN).
   * @param id ID da assinatura
   * @returns Observable void
   */
  suspender(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/suspender`, {});
  }

  /**
   * Cancela uma assinatura (SUPER_ADMIN).
   * @param id ID da assinatura
   * @returns Observable void
   */
  cancelar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/cancelar`, {});
  }
}
