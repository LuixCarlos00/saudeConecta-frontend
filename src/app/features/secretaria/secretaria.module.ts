import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { AuthGuard, RoleGuard } from 'src/app/core/guards';
import { Role } from 'src/app/shared/constants/roles.constant';

const routes: Routes = [
  // Rotas da secretária serão adicionadas aqui (futuro)
  // Todas as rotas devem ter: canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.SECRETARY] }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class SecretariaModule { }
