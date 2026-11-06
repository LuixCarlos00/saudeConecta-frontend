import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPageGuard } from 'src/app/features/publico/guards/landing-page.guard';
import { AssinaturaPlanejamentoComponent } from 'src/app/features/publico/pages/assinatura-planejamento/assinatura-planejamento.component';
import { AssinaturaRetornoComponent } from 'src/app/features/publico/pages/assinatura-retorno/assinatura-retorno.component';
import { CadastroSaasComponent } from 'src/app/features/publico/pages/cadastro-saas/cadastro-saas.component';
import { LandingPageComponent } from 'src/app/features/publico/pages/landing-page/landing-page.component';
import { QuestionarioSaudeComponent } from 'src/app/features/publico/pages/questionario-saude/questionario-saude.component';

/**
 * Rotas da area publico (landing page, cadastro SaaS, retorno de assinatura e paginas publicas por token).
 * Os paths sao os mesmos que existiam no app-routing; a area e carregada sob demanda
 * pelo matcher declarado em app-routing.module.ts.
 */
const routes: Routes = [
  { path: '', component: LandingPageComponent, canActivate: [LandingPageGuard] },
  { path: 'cadastro', component: CadastroSaasComponent },
  { path: 'assinatura/sucesso', component: AssinaturaRetornoComponent, data: { situacao: 'sucesso' } },
  { path: 'assinatura/pendente', component: AssinaturaRetornoComponent, data: { situacao: 'pendente' } },
  { path: 'questionario-saude/:token', component: QuestionarioSaudeComponent },
  { path: 'assinatura-planejamento/:token', component: AssinaturaPlanejamentoComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PublicoRoutingModule {}
