import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { AuthGuard, RoleGuard } from 'src/app/core/auth/guards';
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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';

// Módulo centralizado de Relatórios
import { RelatorioModule } from 'src/app/features/relatorio/relatorio.module';

// Componentes de Cadastros
import { CadastroAdmComponent } from './administrador/cadastros/cadastro-adm/cadastro-adm.component';
import { CadastroAdminOrgComponent } from './administrador/cadastros/cadastro-admin-org/cadastro-admin-org.component';
import { CadastroMedicoComponent } from './administrador/cadastros/cadastro-medico/cadastro-medico.component';
import { CadastroPacienteComponent } from './administrador/cadastros/cadastro-paciente/cadastro-paciente.component';
import { CadastroSecretariaComponent } from './administrador/cadastros/cadastro-secretaria/cadastro-secretaria.component';

// Componentes de Configurações
import { ConfiguracoesSistemaComponent } from './administrador/configuracoes/configuracoes-sistema.component';

// Componentes de Dashboard
import { DashboardComponent } from './administrador/dashboard/dashboard.component';
import { DashboardPlataformaComponent } from './administrador/dashboard/plataforma/dashboard-plataforma.component';
import { GraficosPrincipaisDashboardComponent } from './administrador/dashboard/graficos-principais-dashboard/graficos-principais-dashboard.component';

// Componentes de Agenda Calendário
import { AgendaCalendarioComponent } from './administrador/agenda-calendario/agenda-calendario.component';
import { TotalConsultasDiaPipe } from './administrador/agenda-calendario/total-consultas-dia.pipe';
import { AgendarConsultaComponent } from 'src/app/features/publico/agendar-consulta/agendar-consulta.component';

// Componentes de Gerenciamento de Agenda
import { AgendaComponent } from './administrador/gerenciamento-agenda/agenda/agenda.component';
import { EditarConsultasComponent } from './administrador/gerenciamento-agenda/agenda/Editar-Consultas/Editar-Consultas.component';
import { TabelaEditarMedicosConsultasComponent } from './administrador/gerenciamento-agenda/agenda/Editar-Consultas/tabela-editar-Medicos-Consultas/tabela-editar-Medicos-Consultas.component';
import { TabelaEditarPacienteConsultasComponent } from './administrador/gerenciamento-agenda/agenda/Editar-Consultas/tabela-editar-Paciente-Consultas/tabela-editar-Paciente-Consultas.component';
import { ObservacoesComponent } from './administrador/gerenciamento-agenda/agenda/Observacoes/Observacoes.component';
import { NovaConsultaComponent } from './administrador/gerenciamento-agenda/nova-consuta/nova-consuta.component';
import { TabelaDePacientesComponent } from './administrador/gerenciamento-agenda/nova-consuta/tabela-de-pacientes/tabela-de-pacientes.component';
import { TabelasPesquisasMedicosComponent } from './administrador/gerenciamento-agenda/nova-consuta/tabelas-Pesquisas-Medicos/tabelas-Pesquisas-Medicos.component';

// Componentes de Gerenciamento de Usuários
import { GerenciamentoUsuarioComponent } from './administrador/gerenciamento-usuarios/gerenciamento-usuario.component';
import { ModalAssociarPlanoComponent } from './administrador/gerenciamento-usuarios/tabela-todos-usuarios/modal-associar-plano/modal-associar-plano.component';
import { TabelaTodosUsuariosComponent } from './administrador/gerenciamento-usuarios/tabela-todos-usuarios/tabela-todos-usuarios.component';
import { TrocaSenhaUsuariosComponent } from './administrador/gerenciamento-usuarios/tabela-todos-usuarios/TrocaSenhaUsuarios/TrocaSenhaUsuarios.component';
import { VisualizarEditarUsuarioComponent } from './administrador/gerenciamento-usuarios/tabela-todos-usuarios/VisualizarEditarUsuario/visualizar-editar-usuario.component';

// Componentes de Mensageria
import { MensageriaComponent } from './administrador/mensageria/mensageria.component';

// Componentes de Planos
import { ListaPlanosComponent } from './administrador/planos/lista-planos/lista-planos.component';
import { DetalheAssinaturaComponent } from './administrador/planos/detalhe-assinatura/detalhe-assinatura.component';
import { GerenciarPlanosComponent } from './administrador/planos/gerenciar-planos/gerenciar-planos.component';
 import { ModalValoresAdicionaisComponent } from './administrador/planos/gerenciar-planos/modal-valores-adicionais/modal-valores-adicionais.component';
 

// Componentes de Assinaturas (SUPER_ADMIN)
import { GestaoAssinaturasComponent } from './administrador/assinaturas/gestao-assinaturas/gestao-assinaturas.component';
import { PendenciasManuaisComponent } from './administrador/assinaturas/pendencias-manuais/pendencias-manuais.component';

// Componentes de Suporte
import { SuporteComponent } from './administrador/suporte/suporte.component';
import { GestaoChamadosComponent } from './administrador/suporte/gestao-chamados/gestao-chamados.component';
import { TrocaSenhaComponent } from './administrador/troca-senha/troca-senha.component';

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
    CadastroMedicoComponent,
    CadastroPacienteComponent,
    CadastroSecretariaComponent,
    
    // Componentes de Configurações
    ConfiguracoesSistemaComponent,
    
    // Componentes de Dashboard
    DashboardComponent,
    GraficosPrincipaisDashboardComponent,
    DashboardPlataformaComponent,
    
    // Componentes de Agenda Calendário
    AgendaCalendarioComponent,
    TotalConsultasDiaPipe,
    AgendarConsultaComponent,

    // Componentes de Gerenciamento de Agenda
    AgendaComponent,
    EditarConsultasComponent,
    TabelaEditarMedicosConsultasComponent,
    TabelaEditarPacienteConsultasComponent,
    ObservacoesComponent,
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
    GerenciarPlanosComponent,
     ModalValoresAdicionaisComponent,
 
    
    // Componentes de Assinaturas (SUPER_ADMIN)
    GestaoAssinaturasComponent,
    PendenciasManuaisComponent,

    // Componentes de Suporte
    SuporteComponent,
    GestaoChamadosComponent,
    TrocaSenhaComponent,
 
    // Pipes
    FilterPipe
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes),
    FormsModule,
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
    NgChartsModule,
  ],
  exports: [RouterModule]
})
export class AdministradorModule { }
