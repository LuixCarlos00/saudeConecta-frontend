import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';

// Componentes Públicos
import { AssinaturaPlanejamentoComponent } from './assinatura-planejamento/assinatura-planejamento.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { LoginComponent } from './login/login.component';
import { QuestionarioSaudeComponent } from './questionario-saude/questionario-saude.component';
import { RecuperaCadastroComponent } from './recupera-cadastro/recupera-cadastro/recupera-cadastro.component';

const routes: Routes = [
  // Rotas públicas serão adicionadas aqui
  // { path: 'login', component: LoginComponent },
  // { path: 'cadastro', component: CadastroUsuarioComponent },
  // { path: 'recupera-cadastro', component: RecuperaCadastroComponent },
];

@NgModule({
  declarations: [
    AssinaturaPlanejamentoComponent,
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
  exports: [RouterModule]
})
export class PublicoModule { }
