import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  listarMinhasCobrancas(): Observable<CobrancaTenant[]> {
    return this.http.get<CobrancaTenant[]>(`${this.apiUrl}/minhas-cobrancas`);
  }

  /**
   * Busca cobrança pendente atual da organização (para dashboard).
   * @returns Observable com cobrança pendente ou null
   */
  buscarCobrancaPendenteAtual(): Observable<CobrancaTenant | null> {
    return this.http.get<CobrancaTenant>(`${this.apiUrl}/pendente-atual`).pipe(
      catchError(() => of(null))
    );
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
   * Lista todas as cobranças pendentes (SUPER_ADMIN).
   * @returns Observable com lista de cobranças pendentes
   */
  listarPendentes(): Observable<CobrancaTenant[]> {
    return this.http.get<CobrancaTenant[]>(`${this.apiUrl}/pendentes`);
  }

  /**
   * Confirma pagamento manualmente (SUPER_ADMIN).
   * @param cobrancaId ID da cobrança
   * @returns Observable com a cobrança atualizada
   */
  confirmarPagamento(cobrancaId: number): Observable<CobrancaTenant> {
    return this.http.patch<CobrancaTenant>(`${this.apiUrl}/${cobrancaId}/confirmar-pagamento`, {});
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
