import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';

// Módulo centralizado de Relatórios
import { RelatorioModule } from 'src/app/features/relatorio/relatorio.module';

// Componentes de Agenda
import { AgendaMedicoGerenciamentoComponent } from './agenda/agenda-medico-gerenciamento.component';
import { TabelaAgendaMedicoComponent } from './tabela-agenda/tabela-agenda-medico.component';

// Componentes de Dados Pessoais
import { DadosPessoaisComponent } from './dados-pessoais/DadosPessoais.component';

// Componentes de Prontuario Dentista
import { AbaCodigosTussCidComponent } from './prontuario-dentista/aba-codigos-tuss-cid/aba-codigos-tuss-cid.component';
import { AbaExameObjetivoComponent } from './prontuario-dentista/aba-exame-objetivo/aba-exame-objetivo.component';
import { AbaHistoricoComponent } from './prontuario-dentista/aba-historico/aba-historico.component';
import { AbaIdentificacaoComponent } from './prontuario-dentista/aba-identificacao/aba-identificacao.component';
import { AbaPlanejamentoComponent } from './prontuario-dentista/aba-planejamento/aba-planejamento.component';
import { AbaQuestionarioSaudeComponent } from './prontuario-dentista/aba-questionario-saude/aba-questionario-saude.component';
import { EditarProntuarioDentistaComponent } from './prontuario-dentista/editar-prontuario-dentista/editar-prontuario-dentista.component';
import { ProntuarioDentistaComponent } from './prontuario-dentista/prontuario-dentista.component';

// Componentes de Prontuario Medico
import { AbaCodigosTussCidMedicoComponent } from './prontuario-medico/aba-codigos-tuss-cid-medico/aba-codigos-tuss-cid-medico.component';
import { AbaExameObjetivoMedicoComponent } from './prontuario-medico/aba-exame-objetivo-medico/aba-exame-objetivo-medico.component';
import { AbaHistoricoMedicoComponent } from './prontuario-medico/aba-historico-medico/aba-historico-medico.component';
import { AbaIdentificacaoMedicoComponent } from './prontuario-medico/aba-identificacao-medico/aba-identificacao-medico.component';
import { AbaPlanejamentoMedicoComponent } from './prontuario-medico/aba-planejamento-medico/aba-planejamento-medico.component';
 import { EditarProntuarioMedicoComponent } from './prontuario-medico/editar-prontuario-medico/editar-prontuario-medico.component';
import { ProntuarioMedicoComponent } from './prontuario-medico/prontuario-medico.component';

// Componentes de Prontuario Geral
import { ProntuarioComponent } from './prontuario/prontuario.component';

const routes: Routes = [
  // Rotas do médico serão adicionadas aqui
  // Todas as rotas devem ter: canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.DOCTOR] }
];

@NgModule({
  declarations: [
    // Componentes de Agenda
    AgendaMedicoGerenciamentoComponent,
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
    RelatorioModule,
  ],
  exports: [RouterModule]
})
export class MedicoModule { }
