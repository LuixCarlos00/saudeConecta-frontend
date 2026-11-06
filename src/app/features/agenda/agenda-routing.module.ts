import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, RoleGuard } from 'src/app/core/auth/guards';
import { AgendaCalendarioComponent } from 'src/app/features/agenda/pages/agenda-calendario/agenda-calendario.component';
import { CadastroPacienteComponent } from 'src/app/features/agenda/pages/cadastro-paciente/cadastro-paciente.component';
import { Role } from 'src/app/shared/constants/roles.constant';

/**
 * Rotas da area agenda (agenda, nova consulta, agendar consulta e cadastro de paciente).
 * Os paths sao os mesmos que existiam no app-routing; a area e carregada sob demanda
 * pelo matcher declarado em app-routing.module.ts.
 */
const routes: Routes = [
  { path: 'cadastroPaciente', component: CadastroPacienteComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.SECRETARY] } },
  { path: 'agenda-calendario', component: AgendaCalendarioComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.DOCTOR, Role.SECRETARY] } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AgendaRoutingModule {}
