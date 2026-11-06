import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, RoleGuard } from 'src/app/core/auth/guards';
import { HistoricoDadosPessoaisComponent } from 'src/app/features/auditoria/pages/historico-dados-pessoais/historico-dados-pessoais.component';
import { Role } from 'src/app/shared/constants/roles.constant';

/**
 * Rotas da area auditoria (historico de dados pessoais (componente standalone)).
 * Os paths sao os mesmos que existiam no app-routing; a area e carregada sob demanda
 * pelo matcher declarado em app-routing.module.ts.
 */
const routes: Routes = [
  { path: 'historico-dados-pessoais', component: HistoricoDadosPessoaisComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.SUPER_ADMIN] } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuditoriaRoutingModule {}
