import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FiltroStateService } from 'src/app/services/state/filtro-state.service';
import { DialogService } from 'src/app/util/variados/dialogo-confirmação/dialog.service';
import { CadastroMedicoComponent } from '../cadastros/cadastro-medico/cadastro-medico.component';
import { CadastroPacienteComponent } from '../cadastros/cadastro-paciente/cadastro-paciente.component';
import { CadastroSecretariaComponent } from '../cadastros/cadastro-secretaria/cadastro-secretaria.component';
import { CadastroAdmComponent } from '../cadastros/cadastro-adm/cadastro-adm.component';
import { CadastroAdminOrgComponent } from '../cadastros/cadastro-admin-org/cadastro-admin-org.component';
import { tokenService } from 'src/app/util/Token/Token.service';
import { isSuperAdmin } from 'src/app/shared/constants/roles.constant';
import { AssinaturaApiService } from 'src/app/services/api/assinatura-api.service';
import { LimitesPlano } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gerenciamento-usuario',
  templateUrl: './gerenciamento-usuario.component.html',
  styleUrls: ['./gerenciamento-usuario.component.css'],
})
export class GerenciamentoUsuarioComponent implements OnInit {
  radioValue: number = 0;
  searchText: string = '';
  isLoading: boolean = false;
  isSuperAdmin: boolean = false;
  limites: LimitesPlano | null = null;

  constructor(
    private filtroStateService: FiltroStateService,
    private dialog: MatDialog,
    private tokenSvc: tokenService,
    private assinaturaApiService: AssinaturaApiService
  ) {}

  ngOnInit() {
    const role = this.tokenSvc.obterAutorizacao();
    this.isSuperAdmin = isSuperAdmin(role);
    this.carregarLimites();
  }

  carregarLimites(): void {
    this.assinaturaApiService.obterLimites().subscribe({
      next: (limites) => this.limites = limites,
      error: () => this.limites = null
    });
  }

  calcularPercentual(usado: number, limite: number | null): number {
    if (limite === null || limite === 0) return 0;
    return Math.min((usado / limite) * 100, 100);
  }

  formatarLimite(limite: number | null): string {
    return limite === null ? 'Ilimitado' : `${limite}`;
  }

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
    if (this.limites && !this.limites.podeAdicionarProfissional) {
      this.exibirAlertaLimite('Profissional', this.limites.usadoProfissional, this.limites.limiteProfissional);
      return;
    }
    this.dialog.open(CadastroMedicoComponent, {
      width: '90vw',
      maxWidth: '900px',
      maxHeight: '90vh',
      panelClass: 'cadastro-dialog-panel'
    });
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
    if (this.limites && !this.limites.podeAdicionarSecretaria) {
      this.exibirAlertaLimite('Secretária', this.limites.usadoSecretaria, this.limites.limiteSecretaria);
      return;
    }
    this.dialog.open(CadastroSecretariaComponent, {
      width: '90vw',
      maxWidth: '900px',
      maxHeight: '90vh',
      panelClass: 'cadastro-dialog-panel'
    });
  }

  AdicionarAdminOrg() {
    this.dialog.open(CadastroAdminOrgComponent, {
      width: '90vw',
      maxWidth: '900px',
      maxHeight: '90vh',
      panelClass: 'cadastro-dialog-panel'
    });
  }

  AdicionarAdministrador() {
    if (this.limites && !this.limites.podeAdicionarAdminOrg) {
      this.exibirAlertaLimite('Administrador', this.limites.usadoAdminOrg, this.limites.limiteAdminOrg);
      return;
    }
    this.dialog.open(CadastroAdmComponent, {
      width: '90vw',
      maxWidth: '900px',
      maxHeight: '90vh',
      panelClass: 'cadastro-dialog-panel'
    });
  }

  private exibirAlertaLimite(tipo: string, usado: number, limite: number | null): void {
    Swal.fire({
      icon: 'warning',
      title: 'Limite do plano atingido',
      html: `Você atingiu o limite de <b>${tipo}</b> do seu plano.<br>` +
            `<b>${usado}</b> de <b>${limite}</b> vagas utilizadas.<br><br>` +
            `Faça upgrade do seu plano para cadastrar mais usuários.`,
      confirmButtonText: 'Entendi',
      confirmButtonColor: '#1976d2'
    });
  }
}
