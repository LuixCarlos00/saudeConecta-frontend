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
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from 'src/app/features/dashboard/pages/dashboard/dashboard.component';
import { GraficosPrincipaisDashboardComponent } from 'src/app/features/dashboard/pages/dashboard/graficos-principais-dashboard/graficos-principais-dashboard.component';
import { DashboardPlataformaComponent } from 'src/app/features/dashboard/pages/dashboard/plataforma/dashboard-plataforma.component';

/**
 * Modulo da area dashboard: dashboard (com o painel da plataforma, que e filho do dashboard no template).
 * Carregado sob demanda (lazy) pelo app-routing.
 */
@NgModule({
  declarations: [
    DashboardComponent,
    GraficosPrincipaisDashboardComponent,
    DashboardPlataformaComponent,
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
    DashboardRoutingModule,
  ],
})
export class DashboardModule {}
