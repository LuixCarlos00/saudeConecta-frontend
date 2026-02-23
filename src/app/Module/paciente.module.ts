import { AtestadoDentistaComponent } from 'src/app/features/medico/impressoes-dentista/atestado-dentista/atestado-dentista.component';
import { TrocaSenhaComponent } from './../features/administrador/troca-senha/troca-senha.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatAutocompleteModule } from '@angular/material/autocomplete';



// ========== FEATURES ADMINISTRADOR - CADASTROS ==========
import { CadastroPacienteComponent } from '../features/administrador/cadastros/cadastro-paciente/cadastro-paciente.component';
import { CadastroComponent } from '../features/administrador/cadastros/cadastro/cadastro.component';
import { CadastroMedicoComponent } from '../features/administrador/cadastros/cadastro-medico/cadastro-medico.component';
import { CadastroUsuarioComponent } from '../features/administrador/cadastros/cadastro-usuario/cadastro-usuario.component';
import { CadastroAdmComponent } from '../features/administrador/cadastros/cadastro-adm/cadastro-adm.component';
import { CadastroSecretariaComponent } from '../features/administrador/cadastros/cadastro-secretaria/cadastro-secretaria.component';
import { CadastroAdminOrgComponent } from '../features/administrador/cadastros/cadastro-admin-org/cadastro-admin-org.component';

// ========== FEATURES PÚBLICAS ==========
import { RecuperaCadastroComponent } from '../features/publico/recupera-cadastro/recupera-cadastro/recupera-cadastro.component';

// ========== FEATURES ADMINISTRADOR - GERENCIAMENTO ==========
import { AgendaComponent } from '../features/administrador/gerenciamento-agenda/agenda/agenda.component';
import { ObservacoesComponent } from '../features/administrador/gerenciamento-agenda/agenda/Observacoes/Observacoes.component';
import { EditarConsultasComponent } from '../features/administrador/gerenciamento-agenda/agenda/Editar-Consultas/Editar-Consultas.component';
import { Template_PDFComponent } from '../features/administrador/gerenciamento-agenda/agenda/template_PDF/template_PDF.component';
import { GerenciamentoComponent } from '../features/administrador/gerenciamento-agenda/gerenciamento.component';
import { AvisosLembretesComponent } from '../features/administrador/gerenciamento-agenda/agenda/Avisos-Lembretes/Avisos-Lembretes.component';
import { TabelaEditarMedicosConsultasComponent } from '../features/administrador/gerenciamento-agenda/agenda/Editar-Consultas/tabela-editar-Medicos-Consultas/tabela-editar-Medicos-Consultas.component';
import { TabelaEditarPacienteConsultasComponent } from '../features/administrador/gerenciamento-agenda/agenda/Editar-Consultas/tabela-editar-Paciente-Consultas/tabela-editar-Paciente-Consultas.component';

// ========== FEATURES ADMINISTRADOR - DASHBOARD ==========
import { DashboardComponent } from '../features/administrador/dashboard/dashboard.component';
import { GraficoQntConsultasDiaAnteriorComponent } from '../features/administrador/dashboard/grafico-qnt-consultas-dia-anterior/grafico-qnt-consultas-dia-anterior.component';
import { GraficoAgendamentosDiasSemanasMesComponent } from '../features/administrador/dashboard/grafico-agendamentos-dias-semanas-mes/grafico-agendamentos-dias-semanas-mes.component';
import { GraficoSaldoComponent } from '../features/administrador/dashboard/grafico-saldo/grafico-saldo.component';
import { GraficoCategoriaMedicosComponent } from '../features/administrador/dashboard/grafico-categoria-medicos/grafico-categoria-medicos.component';
import { GraficoConsultasPorStatusComponent } from '../features/administrador/dashboard/grafico-consultas-por-status/grafico-consultas-por-status.component';
import { GraficoMediaTempoConsultaComponent } from '../features/administrador/dashboard/grafico-media-tempo-consulta/grafico-media-tempo-consulta.component';

// ========== FEATURES ADMINISTRADOR - GERENCIAMENTO USUÁRIOS ==========
import { GerenciamentoUsuarioComponent } from '../features/administrador/gerenciamento-usuarios/gerenciamento-usuario.component';
import { TabelaTodosUsuariosComponent } from '../features/administrador/gerenciamento-usuarios/tabela-todos-usuarios/tabela-todos-usuarios.component';
import { TrocaSenhaUsuariosComponent } from '../features/administrador/gerenciamento-usuarios/tabela-todos-usuarios/TrocaSenhaUsuarios/TrocaSenhaUsuarios.component';
import { VisualizarEditarUsuarioComponent } from '../features/administrador/gerenciamento-usuarios/tabela-todos-usuarios/VisualizarEditarUsuario/visualizar-editar-usuario.component';
import { MatBadgeModule } from '@angular/material/badge';

// ========== FEATURES MÉDICO ==========
import { TabelaAgendaMedicoComponent } from '../features/medico/tabela-agenda/tabela-agenda-medico.component';
import { ProntuarioComponent } from '../features/medico/prontuario/prontuario.component';
import { ImprimirPrescricaoComponent } from '../features/medico/impressoes/ImprimirPrescricao/ImprimirPrescricao.component';
import { ImprimirSoliciatacaoDeExamesComponent } from '../features/medico/impressoes/ImprimirSoliciatacaoDeExames/ImprimirSoliciatacaoDeExames.component';
import { HistoricosComponent } from '../features/medico/historico/historicos.component';
import { DadosPessoaisComponent } from '../features/medico/dados-pessoais/DadosPessoais.component';
import { AtestadoPacienteComponent } from '../features/medico/impressoes/AtestadoPaciente/AtestadoPaciente.component';
import { HistoricoCompletoComponent } from '../features/medico/impressoes/historicoCompleto/historicoCompleto.component';
import { SelecaoRelatorioComponent } from '../features/medico/impressoes/selecao-relatorio/selecao-relatorio.component';
import { ImprimirRegistroComponent } from '../features/medico/impressoes/ImprimirRegistro/ImprimirRegistro.component';
import { AgendaMedicoGerenciamentoComponent } from '../features/medico/agenda/agenda-medico-gerenciamento.component';
import { SharedModule } from "../shared/shared.module";
import { NovaConsultaComponent } from '../features/administrador/gerenciamento-agenda/nova-consuta/nova-consuta.component';
import { TabelasPesquisasMedicosComponent } from '../features/administrador/gerenciamento-agenda/nova-consuta/tabelas-Pesquisas-Medicos/tabelas-Pesquisas-Medicos.component';
import { TabelaDePacientesComponent } from '../features/administrador/gerenciamento-agenda/nova-consuta/tabela-de-pacientes/tabela-de-pacientes.component';
import { HistoricoCompletoDentistaComponent } from '../features/medico/impressoes-dentista/historico-completo-dentista/historico-completo-dentista.component';
import { PrescricaoDentistaComponent } from '../features/medico/impressoes-dentista/prescricao-dentista/prescricao-dentista.component';
import { SolicitacaoExamesDentistaComponent } from '../features/medico/impressoes-dentista/solicitacao-exames-dentista/solicitacao-exames-dentista.component';
import { RegistroConsultaDentistaComponent } from '../features/medico/impressoes-dentista/registro-consulta-dentista/registro-consulta-dentista.component';


@NgModule({
  declarations: [
    CadastroPacienteComponent,
    CadastroMedicoComponent,
    CadastroComponent,
    CadastroUsuarioComponent,
    CadastroSecretariaComponent,
    RecuperaCadastroComponent,

    TabelasPesquisasMedicosComponent,
    TabelaDePacientesComponent,
    TrocaSenhaComponent,
    CadastroAdmComponent,
    CadastroAdminOrgComponent,
    AgendaComponent,
    ObservacoesComponent,
    AvisosLembretesComponent,
    EditarConsultasComponent,
    TabelaEditarMedicosConsultasComponent,
    Template_PDFComponent,
    NovaConsultaComponent,
    GerenciamentoComponent,
    DashboardComponent,
    GraficoAgendamentosDiasSemanasMesComponent,
    GraficoQntConsultasDiaAnteriorComponent,
    GraficoSaldoComponent,
    GraficoCategoriaMedicosComponent,
    GraficoConsultasPorStatusComponent,
    GerenciamentoUsuarioComponent,
    TabelaTodosUsuariosComponent,
    TabelaAgendaMedicoComponent,
    ProntuarioComponent,
    TabelaEditarPacienteConsultasComponent,
    ImprimirPrescricaoComponent,
    ImprimirSoliciatacaoDeExamesComponent,
    HistoricosComponent,
    DadosPessoaisComponent,
    AtestadoPacienteComponent,
    TrocaSenhaUsuariosComponent,
    VisualizarEditarUsuarioComponent,
    HistoricoCompletoComponent,
    SelecaoRelatorioComponent,
    ImprimirRegistroComponent,
    AgendaMedicoGerenciamentoComponent,
    HistoricoCompletoDentistaComponent,
    PrescricaoDentistaComponent,
    SolicitacaoExamesDentistaComponent,
    RegistroConsultaDentistaComponent,
    AtestadoDentistaComponent
  ],
  exports: [],

  imports: [
    FormsModule,
    RouterLink,
    ReactiveFormsModule,
    CommonModule,
    MatExpansionModule,
    BrowserModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    FlexLayoutModule,
    MatTableModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatDialogModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatAutocompleteModule,
    MatRadioModule,
    MatBadgeModule,
    SharedModule,
    GraficoMediaTempoConsultaComponent
  ],
})
export class PacienteModule { }
