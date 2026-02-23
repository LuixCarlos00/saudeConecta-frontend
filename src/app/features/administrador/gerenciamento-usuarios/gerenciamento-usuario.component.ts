import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FiltroStateService } from 'src/app/services/state/filtro-state.service';
import { DialogService } from 'src/app/util/variados/dialogo-confirmação/dialog.service';
import { CadastroMedicoComponent } from '../cadastros/cadastro-medico/cadastro-medico.component';
import { CadastroPacienteComponent } from '../cadastros/cadastro-paciente/cadastro-paciente.component';
import { CadastroSecretariaComponent } from '../cadastros/cadastro-secretaria/cadastro-secretaria.component';
import { CadastroAdmComponent } from '../cadastros/cadastro-adm/cadastro-adm.component';

@Component({
  selector: 'app-gerenciamento-usuario',
  templateUrl: './gerenciamento-usuario.component.html',
  styleUrls: ['./gerenciamento-usuario.component.css'],
})
export class GerenciamentoUsuarioComponent implements OnInit {
  radioValue: number = 0;
  searchText: string = '';
  isLoading: boolean = false;

  constructor(
    private filtroStateService: FiltroStateService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {}

  recarregarDados() {
    this.isLoading = true;
    this.filtroStateService.setRecarregar(true);

    // Reset do loading após um pequeno delay
    setTimeout(() => {
      this.isLoading = false;
      this.filtroStateService.setRecarregar(false);
    }, 1000);
  }

  PesquisaDados() {
    this.radioValue = 0;
    this.filtroStateService.setSearchText(this.searchText);
  }

  PesquisaCategoria() {
    this.searchText = '';
    this.filtroStateService.setCategoria(this.radioValue);
  }

  limparCampos() {
    if (this.radioValue) {
      const valor = this.radioValue;
      this.filtroStateService.setCategoria(valor);
    } else {
      this.searchText = '';
      this.radioValue = 0;
    }
  }

  AdicionarClinico() {
    const dialogRef = this.dialog.open(CadastroMedicoComponent, {
      width: '90vw',
      maxWidth: '900px',
      maxHeight: '90vh',
      panelClass: 'cadastro-dialog-panel'
    });
    // A recarga é feita automaticamente pelo componente de cadastro via FiltroStateService
  }

  AdicionarPaciente() {
    const dialogRef = this.dialog.open(CadastroPacienteComponent, {
      width: '90vw',
      maxWidth: '900px',
      maxHeight: '90vh',
      panelClass: 'cadastro-dialog-panel'
    });
    // A recarga é feita automaticamente pelo componente de cadastro via FiltroStateService
  }

  AdicionarSecretaria() {
    const dialogRef = this.dialog.open(CadastroSecretariaComponent, {
      width: '90vw',
      maxWidth: '900px',
      maxHeight: '90vh',
      panelClass: 'cadastro-dialog-panel'
    });
    // A recarga é feita automaticamente pelo componente de cadastro via FiltroStateService
  }

  AdicionarAdministrador() {
    const dialogRef = this.dialog.open(CadastroAdmComponent, {
      width: '90vw',
      maxWidth: '900px',
      maxHeight: '90vh',
      panelClass: 'cadastro-dialog-panel'
    });
    // A recarga é feita automaticamente pelo componente de cadastro via FiltroStateService
  }
}
