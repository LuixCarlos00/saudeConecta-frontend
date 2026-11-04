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

  exibirMensagemErro() {
    this._snackBar.open('Não ha registros com esse parametro.', 'Fechar', {
      duration: 3000,
    });
  }

  exibirMensagemDeRetornoAposCriaConsultaDeMedico() {
    this._snackBar.open('Consulta Criada.', 'Fechar', {
      duration: 3000,
    });
  }


  JaexisteDadosCAdastradosComEssesParamentros() {
    this._snackBar.open('Ja Existe uma consulta marcadas para esse dia com esse horário.\nTente outro horário. Ou altere o dia.', 'Fechar', {
      duration: 10000,
    });
  }

  exibirMensagemParaCamposNaoInformadosDeConsulta() {
    this._snackBar.open('Dados não informados.Tente Novamente.', 'Fechar', {
      duration: 50000,
    });
  }

  NaoFoiEncontradoConsultasComEssesParametros() {
    this._snackBar.open('Não foi encontrado consultas com esses parametros .Tente Novamente.', 'Fechar', {
      duration: 50000,
    });
  }



  NaoHaRegistroParaAsDatasSelecionada() {
    this._snackBar.open('Não ha registro para a data Selecionada', 'Fechar', {
      duration: 50000,
    });
  }


  DeletadoComSucesso() {
    this._snackBar.open(' Deletado Com Sucesso', 'Fechar', {
      duration: 50000,
    });
  }


  CliqueEmSalvarParaFinalizar() {
    this._snackBar.open('Clique em salvar para finalizare salvar os dados do prontuario', 'Fechar', {
      duration: 50000,
    });

  }

}

