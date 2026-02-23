import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Consultav2 } from 'src/app/util/variados/interfaces/consulta/consultav2';

@Injectable({
  providedIn: 'root'
})
export class ConsultaStateService {

  private dadosFiltradosSubject = new BehaviorSubject<Consultav2[]>([]);
  private recarregarTabelaSubject = new BehaviorSubject<boolean>(false);
  private deletarDadosSubject = new BehaviorSubject<boolean>(false);
  private editarDadosSubject = new BehaviorSubject<boolean>(false);
  private concluidoSubject = new BehaviorSubject<boolean>(false);
  private geraPdfSubject = new BehaviorSubject<boolean>(false);
  private cadastroRealizadoSubject = new BehaviorSubject<Consultav2 | null>(null);
  private dadosCronologiaSubject = new BehaviorSubject<any>(null);

  readonly dadosFiltrados$: Observable<Consultav2[]> = this.dadosFiltradosSubject.asObservable();
  readonly recarregarTabela$: Observable<boolean> = this.recarregarTabelaSubject.asObservable();
  readonly deletarDados$: Observable<boolean> = this.deletarDadosSubject.asObservable();
  readonly editarDados$: Observable<boolean> = this.editarDadosSubject.asObservable();
  readonly concluido$: Observable<boolean> = this.concluidoSubject.asObservable();
  readonly geraPdf$: Observable<boolean> = this.geraPdfSubject.asObservable();
  readonly cadastroRealizado$: Observable<Consultav2 | null> = this.cadastroRealizadoSubject.asObservable();
  readonly dadosCronologia$: Observable<any> = this.dadosCronologiaSubject.asObservable();

  setDadosFiltrados(dados: Consultav2[]): void {
    this.dadosFiltradosSubject.next(dados);
  }

  setRecarregarTabela(valor: boolean): void {
    this.recarregarTabelaSubject.next(valor);
  }

  setDeletarDados(valor: boolean): void {
    this.deletarDadosSubject.next(valor);
  }

  setEditarDados(valor: boolean): void {
    this.editarDadosSubject.next(valor);
  }

  setConcluido(valor: boolean): void {
    this.concluidoSubject.next(valor);
  }

  setGeraPdf(valor: boolean): void {
    this.geraPdfSubject.next(valor);
  }

  setCadastroRealizado(consulta: Consultav2): void {
    this.cadastroRealizadoSubject.next(consulta);
  }

  setDadosCronologia(dados: any): void {
    this.dadosCronologiaSubject.next(dados);
  }

  limpar(): void {
    this.dadosFiltradosSubject.next([]);
    this.recarregarTabelaSubject.next(false);
    this.deletarDadosSubject.next(false);
    this.editarDadosSubject.next(false);
    this.concluidoSubject.next(false);
    this.geraPdfSubject.next(false);
    this.cadastroRealizadoSubject.next(null);
    this.dadosCronologiaSubject.next(null);
  }
}
