import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

/**
 * Serviço responsável por fornecer a URL base da API.
 * Utiliza as configurações do environment para determinar a URL correta.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiUrlService {

  private readonly apiUrl: string;

  constructor() {
    this.apiUrl = environment.apiUrl;
  }

  /**
   * Retorna a URL base da API.
   * @returns URL da API backend
   */
  getUrl(): string {
    return this.apiUrl;
  }
}
