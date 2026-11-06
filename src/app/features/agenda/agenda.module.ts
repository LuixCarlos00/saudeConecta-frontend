import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { NgChartsModule } from 'ng2-charts';
import { AgendaRoutingModule } from './agenda-routing.module';
import { EditarConsultasComponent } from 'src/app/features/agenda/components/agenda/Editar-Consultas/Editar-Consultas.component';
import { TabelaEditarMedicosConsultasComponent } from 'src/app/features/agenda/components/agenda/Editar-Consultas/tabela-editar-Medicos-Consultas/tabela-editar-Medicos-Consultas.component';
import { TabelaEditarPacienteConsultasComponent } from 'src/app/features/agenda/components/agenda/Editar-Consultas/tabela-editar-Paciente-Consultas/tabela-editar-Paciente-Consultas.component';
import { ObservacoesComponent } from 'src/app/features/agenda/components/agenda/Observacoes/Observacoes.component';
import { AgendaComponent } from 'src/app/features/agenda/components/agenda/agenda.component';
import { AgendarConsultaComponent } from 'src/app/features/agenda/components/agendar-consulta/agendar-consulta.component';
import { CronologiaComponent } from 'src/app/features/agenda/components/cronologia/cronologia.component';
import { NovaConsultaComponent } from 'src/app/features/agenda/components/nova-consuta/nova-consuta.component';
import { TabelaDePacientesComponent } from 'src/app/features/agenda/components/nova-consuta/tabela-de-pacientes/tabela-de-pacientes.component';
import { TabelasPesquisasMedicosComponent } from 'src/app/features/agenda/components/nova-consuta/tabelas-Pesquisas-Medicos/tabelas-Pesquisas-Medicos.component';
import { AgendaCalendarioComponent } from 'src/app/features/agenda/pages/agenda-calendario/agenda-calendario.component';
import { TotalConsultasDiaPipe } from 'src/app/features/agenda/pages/agenda-calendario/total-consultas-dia.pipe';
import { AgendaDrawerComponent } from 'src/app/features/agenda/pages/agenda-calendario/agenda-drawer/agenda-drawer.component';
import { AgendaVisaoMesComponent } from 'src/app/features/agenda/pages/agenda-calendario/agenda-visao-mes/agenda-visao-mes.component';
import { AgendaVisaoSemanaComponent } from 'src/app/features/agenda/pages/agenda-calendario/agenda-visao-semana/agenda-visao-semana.component';
import { AgendaVisaoDiaComponent } from 'src/app/features/agenda/pages/agenda-calendario/agenda-visao-dia/agenda-visao-dia.component';
import { CadastroPacienteComponent } from 'src/app/features/agenda/pages/cadastro-paciente/cadastro-paciente.component';

/**
 * Modulo da area agenda: agenda, nova consulta, agendar consulta e cadastro de paciente.
 * Carregado sob demanda (lazy) pelo app-routing.
 */
@NgModule({
  declarations: [
    AgendaCalendarioComponent,
    TotalConsultasDiaPipe,
    AgendaDrawerComponent,
    AgendaVisaoMesComponent,
    AgendaVisaoSemanaComponent,
    AgendaVisaoDiaComponent,
    CronologiaComponent,
    AgendarConsultaComponent,
    AgendaComponent,
    EditarConsultasComponent,
    TabelaEditarMedicosConsultasComponent,
    TabelaEditarPacienteConsultasComponent,
    ObservacoesComponent,
    NovaConsultaComponent,
    TabelaDePacientesComponent,
    TabelasPesquisasMedicosComponent,
    CadastroPacienteComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
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
    NgChartsModule,
    AgendaRoutingModule,
  ],
})
export class AgendaModule {}
