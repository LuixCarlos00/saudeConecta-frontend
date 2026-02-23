import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface EnderecoViaCep {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  // Campos adicionais retornados pela ViaCEP
  unidade?: string;
  estado?: string;
  regiao?: string;
  erro?: boolean; // Propriedade opcional para CEP não encontrado
}

@Injectable({
  providedIn: 'root'
})
export class CepApiService {

  private readonly apiUrl = `${environment.apiUrl}/cep`;

  constructor(private http: HttpClient) {}

  /**
   * Busca endereço pelo CEP usando o proxy do backend
   * @param cep CEP para busca (apenas números)
   * @returns Observable com dados do endereço
   */
  buscarEnderecoPorCep(cep: string): Observable<EnderecoViaCep> {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      return throwError(() => new Error('CEP deve conter 8 dígitos'));
    }

    return this.http.get<EnderecoViaCep>(`${this.apiUrl}/${cepLimpo}`).pipe(
      map(response => {
        // Verifica se o CEP foi encontrado (ViaCEP retorna objeto com erro: true para CEP inválido)
        if ('erro' in response && response.erro === true) {
          throw new Error('CEP não encontrado');
        }
        
        // Verifica se os campos essenciais estão vazios (outro padrão de erro da ViaCEP)
        if (!response.logradouro && !response.localidade) {
          throw new Error('CEP não encontrado ou incompleto');
        }
        
        return response;
      })
    );
  }

  /**
   * Formata CEP no padrão XXXXX-XXX
   * @param cep CEP para formatar
   * @returns CEP formatado
   */
  formatarCep(cep: string): string {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length <= 5) {
      return cepLimpo;
    }
    
    return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`;
  }

  /**
   * Limpa CEP removendo caracteres não numéricos
   * @param cep CEP para limpar
   * @returns CEP apenas com números
   */
  limparCep(cep: string): string {
    return cep.replace(/\D/g, '');
  }
}
