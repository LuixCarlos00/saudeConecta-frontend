import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export enum FiltroCategoria {
  PACIENTE = 1,
  MEDICO = 2,
  SECRETARIA = 3,
  ADMINISTRADOR = 4,
  TODOS = 5
}

@Injectable({
  providedIn: 'root'
})
export class FiltroStateService {

  private readonly DEBOUNCE_TIME = 300;

  private categoriaSubject = new BehaviorSubject<FiltroCategoria>(FiltroCategoria.TODOS);
  private searchTextSubject = new BehaviorSubject<string>('');
  private recarregarSubject = new BehaviorSubject<boolean>(false);
  private statusFiltroSubject = new BehaviorSubject<string>('');

  readonly categoria$: Observable<FiltroCategoria> = this.categoriaSubject.asObservable().pipe(
    distinctUntilChanged()
  );

  readonly searchText$: Observable<string> = this.searchTextSubject.asObservable().pipe(
    debounceTime(this.DEBOUNCE_TIME),
    distinctUntilChanged()
  );

  readonly recarregar$: Observable<boolean> = this.recarregarSubject.asObservable();
  readonly statusFiltro$: Observable<string> = this.statusFiltroSubject.asObservable();

  setCategoria(categoria: FiltroCategoria): void {
    this.categoriaSubject.next(categoria);
  }

  setSearchText(texto: string): void {
    this.searchTextSubject.next(texto?.trim() || '');
  }

  setRecarregar(valor: boolean): void {
    this.recarregarSubject.next(valor);
  }

  setStatusFiltro(status: string): void {
    this.statusFiltroSubject.next(status);
  }

  get categoriaAtual(): FiltroCategoria {
    return this.categoriaSubject.getValue();
  }

  get searchTextAtual(): string {
    return this.searchTextSubject.getValue();
  }

  resetar(): void {
    this.categoriaSubject.next(FiltroCategoria.TODOS);
    this.searchTextSubject.next('');
    this.statusFiltroSubject.next('');
  }
}
