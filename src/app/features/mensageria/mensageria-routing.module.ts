import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, RoleGuard } from 'src/app/core/auth/guards';
import { MensageriaComponent } from 'src/app/features/mensageria/pages/mensageria/mensageria.component';
import { Role } from 'src/app/shared/constants/roles.constant';

/**
 * Rotas da area mensageria (mensageria).
 * Os paths sao os mesmos que existiam no app-routing; a area e carregada sob demanda
 * pelo matcher declarado em app-routing.module.ts.
 */
const routes: Routes = [
  { path: 'mensageria', component: MensageriaComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.SECRETARY] } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MensageriaRoutingModule {}
