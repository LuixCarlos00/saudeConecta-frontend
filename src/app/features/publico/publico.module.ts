import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';

const routes: Routes = [
  // Rotas públicas serão adicionadas aqui
  // { path: 'login', component: LoginComponent },
  // { path: 'cadastro', component: CadastroUsuarioComponent },
  // { path: 'recupera-cadastro', component: RecuperaCadastroComponent },
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class PublicoModule { }
