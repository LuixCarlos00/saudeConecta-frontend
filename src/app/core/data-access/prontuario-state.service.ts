import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RascunhoAtendimentoResponse } from 'src/app/shared/models/RascunhoAtendimento';

@Injectable({
  providedIn: 'root'
})
export class ProntuarioStateService {

  private consultaSubject = new BehaviorSubject<any>(null);

  readonly consulta$: Observable<any> = this.consultaSubject.asObservable();

  /** Cache de uma entrada: rascunho que o guard já baixou, para o componente não repetir o GET. */
  private rascunhoPreCarregado: { consultaId: number; rascunho: RascunhoAtendimentoResponse | null } | null = null;

  setRascunhoPreCarregado(consultaId: number, rascunho: RascunhoAtendimentoResponse | null): void {
    this.rascunhoPreCarregado = { consultaId, rascunho };
  }

  /**
   * Entrega e apaga o rascunho pré-carregado, se for da consulta pedida.
   * @returns `{ rascunho }` (que pode ser null = sem rascunho), ou null quando não há cache dessa consulta
   */
  consumirRascunhoPreCarregado(consultaId: number): { rascunho: RascunhoAtendimentoResponse | null } | null {
    const cache = this.rascunhoPreCarregado;
    this.rascunhoPreCarregado = null;
    return cache && cache.consultaId === consultaId ? { rascunho: cache.rascunho } : null;
  }

  setConsulta(consulta: any): void {
    this.consultaSubject.next(consulta);
  }

  changeConsulta(consulta: any): void {
    this.consultaSubject.next(consulta);
  }

  limpar(): void {
    this.consultaSubject.next(null);
    this.rascunhoPreCarregado = null;
  }
}
