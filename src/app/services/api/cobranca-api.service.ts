import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CobrancaTenant } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CobrancaApiService {

  private readonly apiUrl = `${environment.apiUrl}/cobrancas`;

  constructor(private http: HttpClient) { }

  /**
   * Gera uma nova cobrança Pix para a assinatura.
   * @param assinaturaId ID da assinatura
   * @returns Observable com a cobrança gerada (inclui dados Pix)
   */
  gerarCobranca(assinaturaId: number): Observable<CobrancaTenant> {
    return this.http.post<CobrancaTenant>(`${this.apiUrl}/gerar/${assinaturaId}`, {});
  }

  /**
   * Lista cobranças da organização do usuário logado.
   * @returns Observable com lista de cobranças
   */
  minhasCobrancas(): Observable<CobrancaTenant[]> {
    return this.http.get<CobrancaTenant[]>(`${this.apiUrl}/minhas-cobrancas`);
  }

  /**
   * Lista cobranças de uma organização específica (SUPER_ADMIN).
   * @param organizacaoId ID da organização
   * @returns Observable com lista de cobranças
   */
  listarPorOrganizacao(organizacaoId: number): Observable<CobrancaTenant[]> {
    return this.http.get<CobrancaTenant[]>(`${this.apiUrl}/organizacao/${organizacaoId}`);
  }

  /**
   * Busca cobrança pelo txid.
   * @param txid identificador da transação Pix
   * @returns Observable com a cobrança
   */
  buscarPorTxid(txid: string): Observable<CobrancaTenant> {
    return this.http.get<CobrancaTenant>(`${this.apiUrl}/txid/${txid}`);
  }
}
