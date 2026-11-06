import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NgChartsModule } from 'ng2-charts';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from 'src/app/features/auth/pages/login/login.component';
import { RecuperaCadastroComponent } from 'src/app/features/auth/pages/recupera-cadastro/recupera-cadastro.component';
import { TrocaSenhaComponent } from 'src/app/features/auth/pages/troca-senha/troca-senha.component';

/**
 * Modulo da area auth: login, recuperacao de cadastro e troca de senha.
 * Carregado sob demanda (lazy) pelo app-routing.
 */
@NgModule({
  declarations: [
    LoginComponent,
    RecuperaCadastroComponent,
    TrocaSenhaComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
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
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgChartsModule,
    AuthRoutingModule,
  ],
})
export class AuthModule {}
