import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { AuthGuard, RoleGuard } from 'src/app/core/guards';
import { Role } from 'src/app/shared/constants/roles.constant';
import { FilterPipe } from 'src/app/shared/pipes/filter.pipe';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule } from '@angular/forms';

// Módulo centralizado de Relatórios
import { RelatorioModule } from 'src/app/features/relatorio/relatorio.module';

// Componentes de Cadastros
import { CadastroAdmComponent } from './cadastros/cadastro-adm/cadastro-adm.component';
import { CadastroAdminOrgComponent } from './cadastros/cadastro-admin-org/cadastro-admin-org.component';
import { CadastroComponent } from './cadastros/cadastro/cadastro.component';
import { CadastroMedicoComponent } from './cadastros/cadastro-medico/cadastro-medico.component';
import { CadastroPacienteComponent } from './cadastros/cadastro-paciente/cadastro-paciente.component';
import { CadastroSecretariaComponent } from './cadastros/cadastro-secretaria/cadastro-secretaria.component';
import { CadastroUsuarioComponent } from './cadastros/cadastro-usuario/cadastro-usuario.component';

// Componentes de Configurações
import { ConfiguracoesSistemaComponent } from './configuracoes/configuracoes-sistema.component';

// Componentes de Dashboard
import { DashboardComponent } from './dashboard/dashboard.component';
import { GraficoAgendamentosDiasSemanasMesComponent } from './dashboard/grafico-agendamentos-dias-semanas-mes/grafico-agendamentos-dias-semanas-mes.component';
import { GraficoCategoriaMedicosComponent } from './dashboard/grafico-categoria-medicos/grafico-categoria-medicos.component';
import { GraficoConsultasPorStatusComponent } from './dashboard/grafico-consultas-por-status/grafico-consultas-por-status.component';
import { GraficoMediaTempoConsultaComponent } from './dashboard/grafico-media-tempo-consulta/grafico-media-tempo-consulta.component';
import { GraficoQntConsultasDiaAnteriorComponent } from './dashboard/grafico-qnt-consultas-dia-anterior/grafico-qnt-consultas-dia-anterior.component';
import { GraficoSaldoComponent } from './dashboard/grafico-saldo/grafico-saldo.component';

// Componentes de Gerenciamento de Agenda
import { AgendaComponent } from './gerenciamento-agenda/agenda/agenda.component';
import { AvisosLembretesComponent } from './gerenciamento-agenda/agenda/Avisos-Lembretes/Avisos-Lembretes.component';
import { EditarConsultasComponent } from './gerenciamento-agenda/agenda/Editar-Consultas/Editar-Consultas.component';
import { TabelaEditarMedicosConsultasComponent } from './gerenciamento-agenda/agenda/Editar-Consultas/tabela-editar-Medicos-Consultas/tabela-editar-Medicos-Consultas.component';
import { TabelaEditarPacienteConsultasComponent } from './gerenciamento-agenda/agenda/Editar-Consultas/tabela-editar-Paciente-Consultas/tabela-editar-Paciente-Consultas.component';
import { ObservacoesComponent } from './gerenciamento-agenda/agenda/Observacoes/Observacoes.component';
import { GerenciamentoComponent } from './gerenciamento-agenda/gerenciamento.component';
import { NovaConsultaComponent } from './gerenciamento-agenda/nova-consuta/nova-consuta.component';
import { TabelaDePacientesComponent } from './gerenciamento-agenda/nova-consuta/tabela-de-pacientes/tabela-de-pacientes.component';
import { TabelasPesquisasMedicosComponent } from './gerenciamento-agenda/nova-consuta/tabelas-Pesquisas-Medicos/tabelas-Pesquisas-Medicos.component';

// Componentes de Gerenciamento de Usuários
import { GerenciamentoUsuarioComponent } from './gerenciamento-usuarios/gerenciamento-usuario.component';
import { ModalAssociarPlanoComponent } from './gerenciamento-usuarios/tabela-todos-usuarios/modal-associar-plano/modal-associar-plano.component';
import { TabelaTodosUsuariosComponent } from './gerenciamento-usuarios/tabela-todos-usuarios/tabela-todos-usuarios.component';
import { TrocaSenhaUsuariosComponent } from './gerenciamento-usuarios/tabela-todos-usuarios/TrocaSenhaUsuarios/TrocaSenhaUsuarios.component';
import { VisualizarEditarUsuarioComponent } from './gerenciamento-usuarios/tabela-todos-usuarios/VisualizarEditarUsuario/visualizar-editar-usuario.component';

// Componentes de Mensageria
import { MensageriaComponent } from './mensageria/mensageria.component';

// Componentes de Planos
import { ListaPlanosComponent } from './planos/lista-planos/lista-planos.component';
import { DetalheAssinaturaComponent } from './planos/detalhe-assinatura/detalhe-assinatura.component';
import { ModalPixComponent } from './planos/modal-pix/modal-pix.component';
import { GerenciarPlanosComponent } from './planos/gerenciar-planos/gerenciar-planos.component';

// Componentes de Suporte
import { SobreComponent } from './sobre/sobre.component';
import { SuporteComponent } from './suporte/suporte.component';
import { TrocaSenhaComponent } from './troca-senha/troca-senha.component';

const routes: Routes = [
  {
    path: 'planos',
    component: ListaPlanosComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.ADMIN] }
  },
  {
    path: 'gerenciar-planos',
    component: GerenciarPlanosComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.SUPER_ADMIN] }
  },
  {
    path: 'minha-assinatura',
    component: DetalheAssinaturaComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.ADMIN] }
  }
];

@NgModule({
  declarations: [
    // Componentes de Cadastros
    CadastroAdmComponent,
    CadastroAdminOrgComponent,
    CadastroComponent,
    CadastroMedicoComponent,
    CadastroPacienteComponent,
    CadastroSecretariaComponent,
    CadastroUsuarioComponent,
    
    // Componentes de Configurações
    ConfiguracoesSistemaComponent,
    
    // Componentes de Dashboard
    DashboardComponent,
    GraficoAgendamentosDiasSemanasMesComponent,
    GraficoCategoriaMedicosComponent,
    GraficoConsultasPorStatusComponent,
    GraficoMediaTempoConsultaComponent,
    GraficoQntConsultasDiaAnteriorComponent,
    GraficoSaldoComponent,
    
    // Componentes de Gerenciamento de Agenda
    AgendaComponent,
    AvisosLembretesComponent,
    EditarConsultasComponent,
    TabelaEditarMedicosConsultasComponent,
    TabelaEditarPacienteConsultasComponent,
    ObservacoesComponent,
    GerenciamentoComponent,
    NovaConsultaComponent,
    TabelaDePacientesComponent,
    TabelasPesquisasMedicosComponent,
    
    // Componentes de Gerenciamento de Usuários
    GerenciamentoUsuarioComponent,
    ModalAssociarPlanoComponent,
    TabelaTodosUsuariosComponent,
    TrocaSenhaUsuariosComponent,
    VisualizarEditarUsuarioComponent,
    
    // Componentes de Mensageria
    MensageriaComponent,
    
    // Componentes de Planos
    ListaPlanosComponent,
    DetalheAssinaturaComponent,
    ModalPixComponent,
    GerenciarPlanosComponent,
    
    // Componentes de Suporte
    SobreComponent,
    SuporteComponent,
    TrocaSenhaComponent,
    
    // Pipes
    FilterPipe
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatDialogModule,
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    RelatorioModule,
  
  ],
  exports: [RouterModule]
})
export class AdministradorModule { }
