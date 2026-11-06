import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, RoleGuard } from 'src/app/core/auth/guards';
import { DetalheAssinaturaComponent } from 'src/app/features/assinatura/pages/detalhe-assinatura/detalhe-assinatura.component';
import { GerenciarPlanosComponent } from 'src/app/features/assinatura/pages/gerenciar-planos/gerenciar-planos.component';
import { GestaoAssinaturasComponent } from 'src/app/features/assinatura/pages/gestao-assinaturas/gestao-assinaturas.component';
import { PendenciasManuaisComponent } from 'src/app/features/assinatura/pages/pendencias-manuais/pendencias-manuais.component';
import { Role } from 'src/app/shared/constants/roles.constant';

/**
 * Rotas da area assinatura (planos, assinatura do cliente e telas de assinatura do SUPER_ADMIN).
 * Os paths sao os mesmos que existiam no app-routing; a area e carregada sob demanda
 * pelo matcher declarado em app-routing.module.ts.
 */
const routes: Routes = [
  { path: 'gerenciar-planos', component: GerenciarPlanosComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.SUPER_ADMIN] } },
  { path: 'gestao-assinaturas', component: GestaoAssinaturasComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.SUPER_ADMIN] } },
  { path: 'pendencias-manuais', component: PendenciasManuaisComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.SUPER_ADMIN] } },
  { path: 'minha-assinatura', component: DetalheAssinaturaComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.SECRETARY] } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AssinaturaRoutingModule {}
