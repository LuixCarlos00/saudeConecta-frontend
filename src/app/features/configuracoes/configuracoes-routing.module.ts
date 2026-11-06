import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, RoleGuard } from 'src/app/core/auth/guards';
import { ConfiguracoesSistemaComponent } from 'src/app/features/configuracoes/pages/configuracoes/configuracoes-sistema.component';
import { Role } from 'src/app/shared/constants/roles.constant';

/**
 * Rotas da area configuracoes (configuracoes do sistema).
 * Os paths sao os mesmos que existiam no app-routing; a area e carregada sob demanda
 * pelo matcher declarado em app-routing.module.ts.
 */
const routes: Routes = [
  { path: 'sistema', component: ConfiguracoesSistemaComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.DOCTOR, Role.SECRETARY] } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfiguracoesRoutingModule {}
