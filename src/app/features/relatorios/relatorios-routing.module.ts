import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, RoleGuard } from 'src/app/core/auth/guards';
import { Role } from 'src/app/shared/constants/roles.constant';
import { RelatorioModule } from './relatorios.module';
import { RelatoriosPacientesComponent } from './pages/relatorios-pacientes/relatorios-pacientes.component';

/**
 * Rotas da area relatorios. O path e o mesmo que existia no app-routing; a area e carregada
 * sob demanda pelo matcher declarado em app-routing.module.ts.
 *
 * Este modulo e a entrada lazy da area e importa o RelatorioModule (componentes de impressao).
 */
const routes: Routes = [
  { path: 'relatorios', component: RelatoriosPacientesComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.DOCTOR, Role.SECRETARY] } },
];

@NgModule({
  imports: [RelatorioModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RelatoriosRoutingModule {}
