import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';

// Componentes Públicos
import { AssinaturaPlanejamentoComponent } from './publico/pages/assinatura-planejamento/assinatura-planejamento.component';
import { AssinaturaRetornoComponent } from './publico/pages/assinatura-retorno/assinatura-retorno.component';
import { CadastroSaasComponent } from './publico/pages/cadastro-saas/cadastro-saas.component';
import { LandingPageComponent } from './publico/pages/landing-page/landing-page.component';
import { LoginComponent } from './auth/pages/login/login.component';
import { QuestionarioSaudeComponent } from './publico/pages/questionario-saude/questionario-saude.component';
import { RecuperaCadastroComponent } from './auth/pages/recupera-cadastro/recupera-cadastro.component';

const routes: Routes = [
  // Rotas públicas serão adicionadas aqui
  // { path: 'login', component: LoginComponent },
  // { path: 'recupera-cadastro', component: RecuperaCadastroComponent },
];

@NgModule({
  declarations: [
    AssinaturaPlanejamentoComponent,
    AssinaturaRetornoComponent,
    CadastroSaasComponent,
    LandingPageComponent,
    LoginComponent,
    QuestionarioSaudeComponent,
    RecuperaCadastroComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  exports: [
    AssinaturaRetornoComponent,
    CadastroSaasComponent,
    RouterModule
  ]
})
export class PublicoModule { }
