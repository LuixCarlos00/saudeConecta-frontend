import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { LoginModule } from './features/publico/login/login_Module/login.module';
import { PacienteModule } from './Module/paciente.module';
import { UtilModule } from './util/util/util.module';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LoginComponent } from './features/publico/login/login.component';
import { LandingPageComponent } from './features/publico/landing-page/landing-page.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BarraLateraComponent } from './util/variados/barra-Latera/barra-Latera.component';
import { NgChartsModule } from 'ng2-charts';
import { QuillModule } from 'ngx-quill';
import { MatBadgeModule } from '@angular/material/badge';
import { CoreModule } from './core/core.module';
import { ConfiguracoesSistemaComponent } from './features/administrador/configuracoes/configuracoes-sistema.component';
import { SobreComponent } from './features/administrador/sobre/sobre.component';
import { SuporteComponent } from './features/administrador/suporte/suporte.component';
import { FilterPipe } from './shared/pipes/filter.pipe';
import { MensageriaComponent } from './features/administrador/mensageria/mensageria.component';
import { QuestionarioSaudeComponent } from './features/publico/questionario-saude/questionario-saude.component';
import { AssinaturaPlanejamentoComponent } from './features/publico/assinatura-planejamento/assinatura-planejamento.component';

registerLocaleData(localePt);

@NgModule({
  declarations: [AppComponent, LoginComponent, LandingPageComponent, BarraLateraComponent, ConfiguracoesSistemaComponent, SobreComponent, SuporteComponent, FilterPipe, MensageriaComponent, QuestionarioSaudeComponent, AssinaturaPlanejamentoComponent],
  imports: [
    BrowserModule,
    CoreModule, // DEVE ser importado primeiro para registrar os interceptors
    AppRoutingModule,
    LoginModule,
    PacienteModule,
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
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
