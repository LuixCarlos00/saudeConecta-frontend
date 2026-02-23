import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Medico } from '../api/medico-api.service';

@Injectable({
  providedIn: 'root'
})
export class MedicoStateService {

  private medicosSubject = new BehaviorSubject<Medico[]>([]);
  private medicoSelecionadoSubject = new BehaviorSubject<Medico | null>(null);

  readonly medicos$: Observable<Medico[]> = this.medicosSubject.asObservable();
  readonly medicoSelecionado$: Observable<Medico | null> = this.medicoSelecionadoSubject.asObservable();

  setMedicos(medicos: Medico[]): void {
    this.medicosSubject.next(medicos);
  }

  setMedicoSelecionado(medico: Medico | null): void {
    this.medicoSelecionadoSubject.next(medico);
  }

  limparMedicos(): void {
    this.medicosSubject.next([]);
  }

  limpar(): void {
    this.medicosSubject.next([]);
    this.medicoSelecionadoSubject.next(null);
  }
}
