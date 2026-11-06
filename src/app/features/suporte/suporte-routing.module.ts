import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, RoleGuard } from 'src/app/core/auth/guards';
import { GestaoChamadosComponent } from 'src/app/features/suporte/pages/suporte/gestao-chamados/gestao-chamados.component';
import { SuporteComponent } from 'src/app/features/suporte/pages/suporte/suporte.component';
import { Role } from 'src/app/shared/constants/roles.constant';

/**
 * Rotas da area suporte (suporte e gestao de chamados).
 * Os paths sao os mesmos que existiam no app-routing; a area e carregada sob demanda
 * pelo matcher declarado em app-routing.module.ts.
 */
const routes: Routes = [
  { path: 'suporte', component: SuporteComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.DOCTOR, Role.SECRETARY] } },
  { path: 'gestao-chamados', component: GestaoChamadosComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.SUPER_ADMIN] } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SuporteRoutingModule {}
