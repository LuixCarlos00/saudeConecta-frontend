import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotFoudComponent } from '../Erros/Erro404/not-foud.component';
import { CalendarDialogComponent } from '../variados/Cronologia/cronologia.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {MatFormFieldModule} from '@angular/material/form-field';
import {   FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';
import {MatCheckboxModule} from '@angular/material/checkbox';

@NgModule({
  declarations: [
    NotFoudComponent,
    CalendarDialogComponent

  ],
  imports: [
    CommonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatCheckboxModule

  ]
})
export class UtilModule { }
