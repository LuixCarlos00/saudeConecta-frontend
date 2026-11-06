import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// Módulo centralizado de Relatórios
import { RelatorioModule } from 'src/app/features/relatorio/relatorio.module';

// Componentes de Agenda
import { TabelaAgendaMedicoComponent } from './atendimento/components/tabela-agenda/tabela-agenda-medico.component';

// Componentes de Dados Pessoais
import { DadosPessoaisComponent } from './usuarios/pages/dados-pessoais/DadosPessoais.component';

// Componentes de Prontuario Dentista
import { AbaCodigosTussCidComponent } from './atendimento/pages/prontuario-dentista/aba-codigos-tuss-cid/aba-codigos-tuss-cid.component';
import { AbaExameObjetivoComponent } from './atendimento/pages/prontuario-dentista/aba-exame-objetivo/aba-exame-objetivo.component';
import { AbaHistoricoComponent } from './atendimento/pages/prontuario-dentista/aba-historico/aba-historico.component';
import { AbaIdentificacaoComponent } from './atendimento/pages/prontuario-dentista/aba-identificacao/aba-identificacao.component';
import { AbaPlanejamentoComponent } from './atendimento/pages/prontuario-dentista/aba-planejamento/aba-planejamento.component';
import { AbaQuestionarioSaudeComponent } from './atendimento/pages/prontuario-dentista/aba-questionario-saude/aba-questionario-saude.component';
import { EditarProntuarioDentistaComponent } from './atendimento/pages/prontuario-dentista/editar-prontuario-dentista/editar-prontuario-dentista.component';
import { ProntuarioDentistaComponent } from './atendimento/pages/prontuario-dentista/prontuario-dentista.component';

// Componentes de Prontuario Medico
import { AbaCodigosTussCidMedicoComponent } from './atendimento/pages/prontuario-medico/aba-codigos-tuss-cid-medico/aba-codigos-tuss-cid-medico.component';
import { AbaExameObjetivoMedicoComponent } from './atendimento/pages/prontuario-medico/aba-exame-objetivo-medico/aba-exame-objetivo-medico.component';
import { AbaHistoricoMedicoComponent } from './atendimento/pages/prontuario-medico/aba-historico-medico/aba-historico-medico.component';
import { HistoricoRegistroCardComponent } from './atendimento/components/historico-registro-card/historico-registro-card.component';
import { AbaIdentificacaoMedicoComponent } from './atendimento/pages/prontuario-medico/aba-identificacao-medico/aba-identificacao-medico.component';
import { AbaPlanejamentoMedicoComponent } from './atendimento/pages/prontuario-medico/aba-planejamento-medico/aba-planejamento-medico.component';
 import { EditarProntuarioMedicoComponent } from './atendimento/pages/prontuario-medico/editar-prontuario-medico/editar-prontuario-medico.component';
import { ProntuarioMedicoComponent } from './atendimento/pages/prontuario-medico/prontuario-medico.component';

// Componentes de Prontuario Geral
import { ProntuarioComponent } from './atendimento/pages/prontuario/prontuario.component';

const routes: Routes = [
  // Rotas do médico serão adicionadas aqui
  // Todas as rotas devem ter: canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.DOCTOR] }
];

@NgModule({
  declarations: [
    // Componentes de Agenda
    TabelaAgendaMedicoComponent,
    
    // Componentes de Dados Pessoais
    DadosPessoaisComponent,
    
    // Componentes de Prontuario Dentista
    AbaCodigosTussCidComponent,
    AbaExameObjetivoComponent,
    AbaHistoricoComponent,
    AbaIdentificacaoComponent,
    AbaPlanejamentoComponent,
    AbaQuestionarioSaudeComponent,
    EditarProntuarioDentistaComponent,
    ProntuarioDentistaComponent,
    
    // Componentes de Prontuario Medico
    AbaCodigosTussCidMedicoComponent,
    AbaExameObjetivoMedicoComponent,
    AbaHistoricoMedicoComponent,
    HistoricoRegistroCardComponent,
    AbaIdentificacaoMedicoComponent,
    AbaPlanejamentoMedicoComponent,
    AbaQuestionarioSaudeComponent,
    EditarProntuarioMedicoComponent,
    ProntuarioMedicoComponent,
    
    // Componentes de Prontuario Geral
    ProntuarioComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    RelatorioModule,
  ],
  exports: [RouterModule]
})
export class MedicoModule { }
