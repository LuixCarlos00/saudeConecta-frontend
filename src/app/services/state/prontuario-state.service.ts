import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Prontuario } from 'src/app/util/variados/interfaces/Prontuario/Prontuario';

@Injectable({
  providedIn: 'root'
})
export class ProntuarioStateService {

  private examesFisicosSubject = new BehaviorSubject<Prontuario | null>(null);
  private pediatriaExamesFisicosSubject = new BehaviorSubject<any>(null);
  private diagnosticoSubject = new BehaviorSubject<Prontuario | null>(null);
  private prescricaoSubject = new BehaviorSubject<Prontuario | null>(null);
  private consultaSubject = new BehaviorSubject<any>(null);

  readonly examesFisicos$: Observable<Prontuario | null> = this.examesFisicosSubject.asObservable();
  readonly pediatriaExamesFisicos$: Observable<any> = this.pediatriaExamesFisicosSubject.asObservable();
  readonly diagnostico$: Observable<Prontuario | null> = this.diagnosticoSubject.asObservable();
  readonly prescricao$: Observable<Prontuario | null> = this.prescricaoSubject.asObservable();
  readonly consulta$: Observable<any> = this.consultaSubject.asObservable();

  setExamesFisicos(prontuario: Prontuario): void {
    this.examesFisicosSubject.next(prontuario);
  }

  setPediatriaExamesFisicos(dados: any): void {
    this.pediatriaExamesFisicosSubject.next(dados);
  }

  setDiagnostico(prontuario: Prontuario): void {
    this.diagnosticoSubject.next(prontuario);
  }

  setPrescricao(prontuario: Prontuario): void {
    this.prescricaoSubject.next(prontuario);
  }

  setConsulta(consulta: any): void {
    this.consultaSubject.next(consulta);
  }

  changeConsulta(consulta: any): void {
    this.consultaSubject.next(consulta);
  }

  chageDiagnostico(prontuario: any): void {
    this.diagnosticoSubject.next(prontuario);
  }

  chagePrescricao(prontuario: any): void {
    this.prescricaoSubject.next(prontuario);
  }

  limpar(): void {
    this.examesFisicosSubject.next(null);
    this.diagnosticoSubject.next(null);
    this.prescricaoSubject.next(null);
    this.consultaSubject.next(null);
  }
}
