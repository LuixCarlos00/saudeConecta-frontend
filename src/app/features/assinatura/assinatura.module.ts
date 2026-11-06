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
import { AssinaturaRoutingModule } from './assinatura-routing.module';
import { ModalAssociarPlanoComponent } from 'src/app/features/assinatura/components/modal-associar-plano/modal-associar-plano.component';
import { DetalheAssinaturaComponent } from 'src/app/features/assinatura/pages/detalhe-assinatura/detalhe-assinatura.component';
import { GerenciarPlanosComponent } from 'src/app/features/assinatura/pages/gerenciar-planos/gerenciar-planos.component';
import { ModalValoresAdicionaisComponent } from 'src/app/features/assinatura/pages/gerenciar-planos/modal-valores-adicionais/modal-valores-adicionais.component';
import { GestaoAssinaturasComponent } from 'src/app/features/assinatura/pages/gestao-assinaturas/gestao-assinaturas.component';
import { ListaPlanosComponent } from 'src/app/features/assinatura/pages/lista-planos/lista-planos.component';
import { PendenciasManuaisComponent } from 'src/app/features/assinatura/pages/pendencias-manuais/pendencias-manuais.component';

/**
 * Modulo da area assinatura: planos, assinatura do cliente e telas de assinatura do SUPER_ADMIN.
 * Carregado sob demanda (lazy) pelo app-routing.
 */
@NgModule({
  declarations: [
    ListaPlanosComponent,
    DetalheAssinaturaComponent,
    GerenciarPlanosComponent,
    ModalValoresAdicionaisComponent,
    GestaoAssinaturasComponent,
    PendenciasManuaisComponent,
    ModalAssociarPlanoComponent,
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
    AssinaturaRoutingModule,
  ],
})
export class AssinaturaModule {}
