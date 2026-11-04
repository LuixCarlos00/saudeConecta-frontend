import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

/** Módulos comuns para specs de componentes (HTTP e rotas falsos, sem animações reais). */
export const IMPORTS_TESTE_PADRAO = [
  HttpClientTestingModule,
  RouterTestingModule,
  MatDialogModule,
  NoopAnimationsModule,
  FormsModule,
  ReactiveFormsModule,
];

/** Providers para componentes abertos como dialog: dados vazios e dialogRef falso. */
export const PROVIDERS_TESTE_PADRAO = [
  { provide: MatDialogRef, useValue: { close: () => {} } },
  { provide: MAT_DIALOG_DATA, useValue: {} },
];

/** Ignora elementos/diretivas do template (Angular Material, componentes filhos) nos testes de criação. */
export const SCHEMAS_TESTE_PADRAO = [NO_ERRORS_SCHEMA];
