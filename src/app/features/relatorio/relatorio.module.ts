import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';

// Componente seletor de relatório
import { RelatorioComponent } from './relatorio.component';

// Componentes de Impressão - Dentista
import { AtestadoDentistaComponent } from './impressoes-dentista/atestado-dentista/atestado-dentista.component';
import { ComprovantePagamentoDentistaComponent } from './impressoes-dentista/comprovante-pagamento-dentista/comprovante-pagamento-dentista.component';
import { ExamesDentistaComponent } from './impressoes-dentista/exames-dentista/exames-dentista.component';
import { HistoricoCompletoDentistaComponent } from './impressoes-dentista/historico-completo-dentista/historico-completo-dentista.component';
import { PlanejamentoDentistaComponent } from './impressoes-dentista/planejamento-dentista/planejamento-dentista.component';
import { PrescricaoDentistaComponent } from './impressoes-dentista/prescricao-dentista/prescricao-dentista.component';
import { QuestionarioSaudeDentistaComponent } from './impressoes-dentista/questionario-saude-dentista/questionario-saude-dentista.component';
import { RegistroConsultaDentistaComponent } from './impressoes-dentista/registro-consulta-dentista/registro-consulta-dentista.component';

// Componentes de Impressão - Médico
import { AtestadoMedicoComponent } from './impressoes-medico/atestado-medico/AtestadoMedico.component';
import { ComprovantePagamentoMedicoComponent } from './impressoes-medico/comprovante-pagamento-medico/comprovante-pagamento-medico.component';
import { ExamesMedicosComponent } from './impressoes-medico/exames-medicos/exames-medicos.component';
import { HistoricoCompletoMedicoComponent } from './impressoes-medico/historico-completo-medico/historico-completo-medico.component';
import { PlanejamentoMedicoComponent } from './impressoes-medico/planejamento-medico/planejamento-medico.component';
import { PrescricaoMedicoComponent } from './impressoes-medico/prescricao-medico/prescricao-medico.component';
import { QuestionarioSaudeMedicoComponent } from './impressoes-medico/questionario-saude-medico/questionario-saude-medico.component';
import { RegistroConsulataMedicoComponent } from './impressoes-medico/registro-consulta-medico/registro-consulta-medico.component';

/**
 * Módulo centralizado de Relatórios.
 *
 * Agrupa todos os componentes de impressão (médico e dentista),
 * o seletor de relatório e o serviço de lógica de negócio.
 *
 * Deve ser importado pelos módulos que precisam abrir relatórios
 * (AdministradorModule, MedicoModule, AppModule).
 */
@NgModule({
  declarations: [
    // Seletor de relatório
    RelatorioComponent,

    // Impressões Dentista
    AtestadoDentistaComponent,
    ComprovantePagamentoDentistaComponent,
    ExamesDentistaComponent,
    HistoricoCompletoDentistaComponent,
    PlanejamentoDentistaComponent,
    PrescricaoDentistaComponent,
    QuestionarioSaudeDentistaComponent,
    RegistroConsultaDentistaComponent,

    // Impressões Médico
    AtestadoMedicoComponent,
    ComprovantePagamentoMedicoComponent,
    ExamesMedicosComponent,
    HistoricoCompletoMedicoComponent,
    PlanejamentoMedicoComponent,
    PrescricaoMedicoComponent,
    QuestionarioSaudeMedicoComponent,
    RegistroConsulataMedicoComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
  ],
  exports: [
    // Exporta o seletor para que outros módulos possam usá-lo se necessário
    RelatorioComponent,
  ],
})
export class RelatorioModule {}
