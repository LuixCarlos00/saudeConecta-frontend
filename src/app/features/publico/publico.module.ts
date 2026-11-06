import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { PublicoRoutingModule } from './publico-routing.module';
import { AssinaturaPlanejamentoComponent } from 'src/app/features/publico/pages/assinatura-planejamento/assinatura-planejamento.component';
import { AssinaturaRetornoComponent } from 'src/app/features/publico/pages/assinatura-retorno/assinatura-retorno.component';
import { CadastroSaasComponent } from 'src/app/features/publico/pages/cadastro-saas/cadastro-saas.component';
import { LandingPageComponent } from 'src/app/features/publico/pages/landing-page/landing-page.component';
import { QuestionarioSaudeComponent } from 'src/app/features/publico/pages/questionario-saude/questionario-saude.component';

/**
 * Modulo da area publico: landing page, cadastro SaaS, retorno de assinatura e paginas publicas por token.
 * Carregado sob demanda (lazy) pelo app-routing.
 */
@NgModule({
  declarations: [
    LandingPageComponent,
    CadastroSaasComponent,
    AssinaturaRetornoComponent,
    QuestionarioSaudeComponent,
    AssinaturaPlanejamentoComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    PublicoRoutingModule,
  ],
})
export class PublicoModule {}
