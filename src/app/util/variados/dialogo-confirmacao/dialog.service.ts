import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CronologiaComponent } from '../Cronologia/cronologia.component';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})
export class DialogService {






  constructor(
    private _snackBar: MatSnackBar,
    private dialog: MatDialog,
    private consultaApi: ConsultaApiService) { }


  JaexisteDadosCAdastradosComEssesParamentros() {
    this._snackBar.open('Ja Existe uma consulta marcadas para esse dia com esse horário.\nTente outro horário. Ou altere o dia.', 'Fechar', {
      duration: 10000,
    });
  }

  NaoFoiEncontradoConsultasComEssesParametros() {
    this._snackBar.open('Não foi encontrado consultas com esses parametros .Tente Novamente.', 'Fechar', {
      duration: 50000,
    });
  }





}

