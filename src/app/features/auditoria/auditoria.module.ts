import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditoriaRoutingModule } from './auditoria-routing.module';

/**
 * Modulo da area auditoria: historico de dados pessoais.
 * O unico componente da area e standalone (declara os proprios imports); o modulo so existe
 * para carregar a area sob demanda (lazy) pelo app-routing.
 */
@NgModule({
  imports: [CommonModule, AuditoriaRoutingModule],
})
export class AuditoriaModule {}
