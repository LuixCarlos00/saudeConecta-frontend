import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerLocaleData, DatePipe } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { PublicoModule } from './features/publico/publico.module';
import { UtilModule } from './util/util/util.module';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BarraLateraComponent } from './util/variados/barra-Latera/barra-Latera.component';
import { NgChartsModule } from 'ng2-charts';
import { MatBadgeModule } from '@angular/material/badge';
import { CoreModule } from './core/core.module';
import { AdministradorModule } from './features/administrador/administrador.module';

import { MedicoModule } from './features/medico/medico.module';
import { RelatorioModule } from './features/relatorio/relatorio.module';

registerLocaleData(localePt);

@NgModule({
  declarations: [AppComponent, BarraLateraComponent],
  imports: [
    BrowserModule,
    CoreModule,  
    AppRoutingModule,
    PublicoModule,
    AdministradorModule,
    MedicoModule,
    RelatorioModule,
    UtilModule,
    MatIconModule,
    MatToolbarModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgChartsModule,
    MatBadgeModule
  ],
  providers: [
    provideAnimationsAsync(),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    DatePipe
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
