import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';

import { ConsultaEdicao, TipoProntuario } from './consulta-edicao';
import { EditarProntuarioMedicoComponent } from './prontuario-medico/editar-prontuario-medico/editar-prontuario-medico.component';
import { EditarProntuarioDentistaComponent } from './prontuario-dentista/editar-prontuario-dentista/editar-prontuario-dentista.component';

/**
 * Abre a tela de edição do prontuário (médico ou odontológico) como dialog.
 * Único ponto que sabe qual componente corresponde a cada tipo, para o histórico
 * e o atalho do 409 PRONTUARIO_JA_FINALIZADO não duplicarem a configuração do dialog.
 */
@Injectable({ providedIn: 'root' })
export class EdicaoProntuarioService {

  constructor(private dialog: MatDialog) {}

  /**
   * Abre a edição do prontuário da consulta.
   *
   * @param tipo MEDICO ou DENTISTA
   * @param consulta dados da consulta cujo prontuário será editado
   * @returns Observable que emite true quando o usuário salvou e false quando fechou sem salvar
   */
  editar(tipo: TipoProntuario, consulta: ConsultaEdicao): Observable<boolean> {
    const config = {
      width: '1100px',
      maxWidth: '95vw',
      maxHeight: '92vh',
      autoFocus: false,
      disableClose: true,
      data: { consulta },
    };
    const ref = tipo === 'DENTISTA'
      ? this.dialog.open(EditarProntuarioDentistaComponent, config)
      : this.dialog.open(EditarProntuarioMedicoComponent, config);
    return ref.afterClosed().pipe(map(resultado => resultado === true));
  }
}
