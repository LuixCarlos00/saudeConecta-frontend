import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Consultav2 } from 'src/app/shared/models/consultav2';

@Injectable({
  providedIn: 'root'
})
export class ConsultaStateService {

  private cadastroRealizadoSubject = new Subject<Consultav2>();
  private dadosCronologiaSubject = new Subject<any>();

  readonly cadastroRealizado$: Observable<Consultav2> = this.cadastroRealizadoSubject.asObservable();
  readonly dadosCronologia$: Observable<any> = this.dadosCronologiaSubject.asObservable();

  setCadastroRealizado(consulta: Consultav2): void {
    this.cadastroRealizadoSubject.next(consulta);
  }

  setDadosCronologia(dados: any): void {
    this.dadosCronologiaSubject.next(dados);
  }

}
