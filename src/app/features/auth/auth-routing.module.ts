import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, RoleGuard } from 'src/app/core/auth/guards';
import { GuardaRotasLogin } from 'src/app/features/auth/guards/GuardaRotasLogin';
import { LoginComponent } from 'src/app/features/auth/pages/login/login.component';
import { RecuperaCadastroComponent } from 'src/app/features/auth/pages/recupera-cadastro/recupera-cadastro.component';
import { TrocaSenhaComponent } from 'src/app/features/auth/pages/troca-senha/troca-senha.component';
import { Role } from 'src/app/shared/constants/roles.constant';

/**
 * Rotas da area auth (login, recuperacao de cadastro e troca de senha).
 * Os paths sao os mesmos que existiam no app-routing; a area e carregada sob demanda
 * pelo matcher declarado em app-routing.module.ts.
 */
const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [GuardaRotasLogin] },
  { path: 'recuperaCadastro', component: RecuperaCadastroComponent },
  { path: 'trocaSenha', component: TrocaSenhaComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.DOCTOR, Role.SECRETARY] } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
