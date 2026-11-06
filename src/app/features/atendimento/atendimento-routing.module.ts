import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, RoleGuard } from 'src/app/core/auth/guards';
import { ProntuarioGuard } from 'src/app/features/atendimento/guards/prontuario.guard';
import { ProntuarioDentistaComponent } from 'src/app/features/atendimento/pages/prontuario-dentista/prontuario-dentista.component';
import { ProntuarioMedicoComponent } from 'src/app/features/atendimento/pages/prontuario-medico/prontuario-medico.component';
import { ProntuarioComponent } from 'src/app/features/atendimento/pages/prontuario/prontuario.component';
import { Role } from 'src/app/shared/constants/roles.constant';

/**
 * Rotas da area atendimento (prontuarios (medico e dentista), abas de atendimento e historico).
 * Os paths sao os mesmos que existiam no app-routing; a area e carregada sob demanda
 * pelo matcher declarado em app-routing.module.ts.
 */
const routes: Routes = [
  { path: 'startconsulta', component: ProntuarioMedicoComponent, canActivate: [AuthGuard, RoleGuard, ProntuarioGuard], data: { roles: [Role.DOCTOR] } },
  { path: 'startconsulta/:consultaId', component: ProntuarioMedicoComponent, canActivate: [AuthGuard, RoleGuard, ProntuarioGuard], data: { roles: [Role.DOCTOR] } },
  { path: 'startconsulta-dentista', component: ProntuarioDentistaComponent, canActivate: [AuthGuard, RoleGuard, ProntuarioGuard], data: { roles: [Role.DOCTOR] } },
  { path: 'startconsulta-dentista/:consultaId', component: ProntuarioDentistaComponent, canActivate: [AuthGuard, RoleGuard, ProntuarioGuard], data: { roles: [Role.DOCTOR] } },
  { path: 'Prontuario', component: ProntuarioComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.DOCTOR] } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AtendimentoRoutingModule {}
