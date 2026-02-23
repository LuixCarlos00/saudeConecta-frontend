import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Healthcare Design System Components (Standalone)
import { PatientHeaderComponent } from './components/patient-header/patient-header.component';
import { VitalSignsComponent } from './components/vital-signs/vital-signs.component';
import { PatientQueueComponent } from './components/patient-queue/patient-queue.component';
import { MedicalAlertComponent, AlertContainerComponent } from './components/medical-alert/medical-alert.component';
import { AlertToastContainerComponent } from './components/alert-toast-container/alert-toast-container.component';

// Pipes
import { DiaSemanaPipe } from './pipes/dia-semana.pipe';
import { HorarioPipe } from './pipes/horario.pipe';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';

/**
 * Componentes Healthcare Standalone para reutilização
 */
const HEALTHCARE_COMPONENTS = [
  PatientHeaderComponent,
  VitalSignsComponent,
  PatientQueueComponent,
  MedicalAlertComponent,
  AlertContainerComponent,
  AlertToastContainerComponent
];

/**
 * Módulos Angular Material para reutilização
 */
const MATERIAL_MODULES = [
  MatButtonModule,
  MatInputModule,
  MatFormFieldModule,
  MatSelectModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatDialogModule,
  MatSnackBarModule,
  MatIconModule,
  MatCardModule,
  MatProgressSpinnerModule,
  MatCheckboxModule,
  MatRadioModule,
  MatTabsModule,
  MatExpansionModule,
  MatAutocompleteModule,
  MatBadgeModule,
  MatToolbarModule,
  MatSidenavModule,
  MatMenuModule
];

/**
 * Módulo Shared - Componentes, pipes, directives e módulos reutilizáveis
 * Pode ser importado em qualquer feature module
 */
@NgModule({
  declarations: [
    // Componentes compartilhados serão adicionados aqui
    DiaSemanaPipe,
    HorarioPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ...MATERIAL_MODULES,
    // Standalone components
    ...HEALTHCARE_COMPONENTS
  ],
  exports: [
    // Módulos básicos
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // Material modules
    ...MATERIAL_MODULES,
    // Healthcare Design System Components
    ...HEALTHCARE_COMPONENTS,
    // Pipes
    DiaSemanaPipe,
    HorarioPipe
  ]
})
export class SharedModule { }
