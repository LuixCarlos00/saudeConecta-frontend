import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { AuthGuard, RoleGuard } from 'src/app/core/guards';
import { Role } from 'src/app/shared/constants/roles.constant';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';

import { ListaPlanosComponent } from './planos/lista-planos/lista-planos.component';
import { DetalheAssinaturaComponent } from './planos/detalhe-assinatura/detalhe-assinatura.component';
import { ModalPixComponent } from './planos/modal-pix/modal-pix.component';
import { GerenciarPlanosComponent } from './planos/gerenciar-planos/gerenciar-planos.component';

const routes: Routes = [
  {
    path: 'planos',
    component: ListaPlanosComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.ADMIN] }
  },
  {
    path: 'gerenciar-planos',
    component: GerenciarPlanosComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.SUPER_ADMIN] }
  },
  {
    path: 'minha-assinatura',
    component: DetalheAssinaturaComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.ADMIN] }
  }
];

@NgModule({
  declarations: [
    ListaPlanosComponent,
    DetalheAssinaturaComponent,
    ModalPixComponent,
    GerenciarPlanosComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatDialogModule,
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  exports: [RouterModule]
})
export class AdministradorModule { }
