import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { AuthGuard, RoleGuard } from 'src/app/core/guards';
import { Role } from 'src/app/shared/constants/roles.constant';

const routes: Routes = [
  // Rotas do administrador serão adicionadas aqui
  // Todas as rotas devem ter: canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN] }
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
export class AdministradorModule { }
