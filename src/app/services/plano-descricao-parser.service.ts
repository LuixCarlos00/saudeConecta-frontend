import { Injectable } from '@angular/core';

/**
 * Interface para representar a descrição parseada de um plano.
 */
export interface PlanoDescricao {
  titulo: string;
  recursos: string[];
}

/**
 * Serviço para fazer parse e formatação da descrição dos planos.
 * Formato esperado: "titulo: <descrição>\nRecursos: [<recursos em JSON>]"
 */
@Injectable({
  providedIn: 'root'
})
export class PlanoDescricaoParserService {

  private readonly TITULO_PATTERN = /^titulo:\s*(.+)$/m;
  private readonly RECURSOS_PATTERN = /^Recursos:\s*(\[.*\])$/m;

  constructor() { }

  /**
   * Faz parse da descrição no formato "titulo: xxx\nRecursos: [xxx, xxx]"
   *
   * @param descricao descrição completa do plano
   * @returns PlanoDescricao com titulo e recursos parseados
   */
  parse(descricao: string): PlanoDescricao {
    if (!descricao || descricao.trim().length === 0) {
      return { titulo: '', recursos: [] };
    }

    const result: PlanoDescricao = {
      titulo: '',
      recursos: []
    };

    // Extrair título
    const tituloMatch = descricao.match(this.TITULO_PATTERN);
    if (tituloMatch) {
      result.titulo = tituloMatch[1].trim();
    } else {
      // Se não encontrar o padrão, usa a descrição inteira como título
      result.titulo = descricao.trim();
    }

    // Extrair recursos (JSON array)
    const recursosMatch = descricao.match(this.RECURSOS_PATTERN);
    if (recursosMatch) {
      try {
        const recursosJson = recursosMatch[1];
        result.recursos = JSON.parse(recursosJson);
      } catch (e) {
        console.warn('Erro ao fazer parse de recursos JSON:', e);
        result.recursos = [];
      }
    }

    return result;
  }

  /**
   * Formata título e recursos no padrão esperado.
   *
   * @param titulo   título do plano
   * @param recursos lista de recursos
   * @returns String formatada "titulo: xxx\nRecursos: [xxx, xxx]"
   */
  format(titulo: string, recursos: string[]): string {
    if (!titulo || titulo.trim().length === 0) {
      titulo = '';
    }

    if (!recursos || recursos.length === 0) {
      return `titulo: ${titulo.trim()}`;
    }

    try {
      const recursosJson = JSON.stringify(recursos);
      return `titulo: ${titulo.trim()}\nRecursos: ${recursosJson}`;
    } catch (e) {
      console.error('Erro ao converter recursos para JSON:', e);
      return `titulo: ${titulo.trim()}`;
    }
  }

  /**
   * Formata a descrição para compatibilidade com versões antigas (sem recursos).
   *
   * @param descricao descrição simples (apenas texto)
   * @returns String formatada "titulo: xxx\nRecursos: []"
   */
  formatFromSimpleDescription(descricao: string): string {
    return this.format(descricao || '', []);
  }
}