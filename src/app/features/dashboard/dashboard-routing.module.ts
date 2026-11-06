import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, RoleGuard } from 'src/app/core/auth/guards';
import { DashboardComponent } from 'src/app/features/dashboard/pages/dashboard/dashboard.component';
import { Role } from 'src/app/shared/constants/roles.constant';

/**
 * Rotas da area dashboard (dashboard (com o painel da plataforma, que e filho do dashboard no template)).
 * Os paths sao os mesmos que existiam no app-routing; a area e carregada sob demanda
 * pelo matcher declarado em app-routing.module.ts.
 */
const routes: Routes = [
  { path: 'Dashboard', component: DashboardComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.DOCTOR, Role.SECRETARY] } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
