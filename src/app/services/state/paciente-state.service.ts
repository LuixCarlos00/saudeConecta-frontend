import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Paciente } from '../api/paciente-api.service';

@Injectable({
  providedIn: 'root'
})
export class PacienteStateService {

  private pacientesSubject = new BehaviorSubject<Paciente[]>([]);
  private pacienteSelecionadoSubject = new BehaviorSubject<Paciente | null>(null);

  readonly pacientes$: Observable<Paciente[]> = this.pacientesSubject.asObservable();
  readonly pacienteSelecionado$: Observable<Paciente | null> = this.pacienteSelecionadoSubject.asObservable();

  setPacientes(pacientes: Paciente[]): void {
    this.pacientesSubject.next(pacientes);
  }

  setPacienteSelecionado(paciente: Paciente | null): void {
    this.pacienteSelecionadoSubject.next(paciente);
  }

  limpar(): void {
    this.pacientesSubject.next([]);
    this.pacienteSelecionadoSubject.next(null);
  }
}
