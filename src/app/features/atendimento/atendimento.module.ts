import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AtendimentoRoutingModule } from './atendimento-routing.module';
import { HistoricoRegistroCardComponent } from 'src/app/features/atendimento/components/historico-registro-card/historico-registro-card.component';
import { TabelaAgendaMedicoComponent } from 'src/app/features/atendimento/components/tabela-agenda/tabela-agenda-medico.component';
import { AbaCodigosTussCidComponent } from 'src/app/features/atendimento/pages/prontuario-dentista/aba-codigos-tuss-cid/aba-codigos-tuss-cid.component';
import { AbaExameObjetivoComponent } from 'src/app/features/atendimento/pages/prontuario-dentista/aba-exame-objetivo/aba-exame-objetivo.component';
import { AbaHistoricoComponent } from 'src/app/features/atendimento/pages/prontuario-dentista/aba-historico/aba-historico.component';
import { AbaIdentificacaoComponent } from 'src/app/features/atendimento/pages/prontuario-dentista/aba-identificacao/aba-identificacao.component';
import { AbaPlanejamentoComponent } from 'src/app/features/atendimento/pages/prontuario-dentista/aba-planejamento/aba-planejamento.component';
import { AbaQuestionarioSaudeComponent } from 'src/app/features/atendimento/pages/prontuario-dentista/aba-questionario-saude/aba-questionario-saude.component';
import { EditarProntuarioDentistaComponent } from 'src/app/features/atendimento/pages/prontuario-dentista/editar-prontuario-dentista/editar-prontuario-dentista.component';
import { ProntuarioDentistaComponent } from 'src/app/features/atendimento/pages/prontuario-dentista/prontuario-dentista.component';
import { AbaCodigosTussCidMedicoComponent } from 'src/app/features/atendimento/pages/prontuario-medico/aba-codigos-tuss-cid-medico/aba-codigos-tuss-cid-medico.component';
import { AbaExameObjetivoMedicoComponent } from 'src/app/features/atendimento/pages/prontuario-medico/aba-exame-objetivo-medico/aba-exame-objetivo-medico.component';
import { AbaHistoricoMedicoComponent } from 'src/app/features/atendimento/pages/prontuario-medico/aba-historico-medico/aba-historico-medico.component';
import { AbaIdentificacaoMedicoComponent } from 'src/app/features/atendimento/pages/prontuario-medico/aba-identificacao-medico/aba-identificacao-medico.component';
import { AbaPlanejamentoMedicoComponent } from 'src/app/features/atendimento/pages/prontuario-medico/aba-planejamento-medico/aba-planejamento-medico.component';
import { EditarProntuarioMedicoComponent } from 'src/app/features/atendimento/pages/prontuario-medico/editar-prontuario-medico/editar-prontuario-medico.component';
import { ProntuarioMedicoComponent } from 'src/app/features/atendimento/pages/prontuario-medico/prontuario-medico.component';
import { ProntuarioComponent } from 'src/app/features/atendimento/pages/prontuario/prontuario.component';

/**
 * Modulo da area atendimento: prontuarios (medico e dentista), abas de atendimento e historico.
 * Carregado sob demanda (lazy) pelo app-routing.
 */
@NgModule({
  declarations: [
    TabelaAgendaMedicoComponent,
    AbaCodigosTussCidComponent,
    AbaExameObjetivoComponent,
    AbaHistoricoComponent,
    AbaIdentificacaoComponent,
    AbaPlanejamentoComponent,
    AbaQuestionarioSaudeComponent,
    EditarProntuarioDentistaComponent,
    ProntuarioDentistaComponent,
    AbaCodigosTussCidMedicoComponent,
    AbaExameObjetivoMedicoComponent,
    AbaHistoricoMedicoComponent,
    HistoricoRegistroCardComponent,
    AbaIdentificacaoMedicoComponent,
    AbaPlanejamentoMedicoComponent,
    EditarProntuarioMedicoComponent,
    ProntuarioMedicoComponent,
    ProntuarioComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    AtendimentoRoutingModule,
  ],
})
export class AtendimentoModule {}
