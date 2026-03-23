import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';

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

// Componentes de Relatorio - Impressoes Dentista
import { AtestadoDentistaComponent } from './relatorio/impressoes-dentista/atestado-dentista/atestado-dentista.component';
import { ComprovantePagamentoDentistaComponent } from './relatorio/impressoes-dentista/comprovante-pagamento-dentista/comprovante-pagamento-dentista.component';
import { HistoricoCompletoDentistaComponent } from './relatorio/impressoes-dentista/historico-completo-dentista/historico-completo-dentista.component';
import { PlanejamentoDentistaComponent } from './relatorio/impressoes-dentista/planejamento-dentista/planejamento-dentista.component';
import { PrescricaoDentistaComponent } from './relatorio/impressoes-dentista/prescricao-dentista/prescricao-dentista.component';
import { QuestionarioSaudeDentistaComponent } from './relatorio/impressoes-dentista/questionario-saude-dentista/questionario-saude-dentista.component';
import { RegistroConsultaDentistaComponent } from './relatorio/impressoes-dentista/registro-consulta-dentista/registro-consulta-dentista.component';
import { ExamesDentistaComponent } from './relatorio/impressoes-dentista/exames-dentista/exames-dentista.component';

// Componentes de Relatorio - Impressoes Medico
import { AtestadoMedicoComponent } from './relatorio/impressoes-medico/atestado-medico/AtestadoMedico.component';
import { ComprovantePagamentoMedicoComponent } from './relatorio/impressoes-medico/comprovante-pagamento-medico/comprovante-pagamento-medico.component';
import { QuestionarioSaudeMedicoComponent } from './relatorio/impressoes-medico/questionario-saude-medico/questionario-saude-medico.component';
import { HistoricoCompletoMedicoComponent } from './relatorio/impressoes-medico/historico-completo-medico/historico-completo-medico.component';
import { PrescricaoMedicoComponent } from './relatorio/impressoes-medico/prescricao-medico/prescricao-medico.component';
import { RegistroConsulataMedicoComponent } from './relatorio/impressoes-medico/registro-consulta-medico/registro-consulta-medico.component';
import { ExamesMedicosComponent } from './relatorio/impressoes-medico/exames-medicos/exames-medicos.component';
import { PlanejamentoMedicoComponent } from './relatorio/impressoes-medico/planejamento-medico/planejamento-medico.component';

// Componentes de Relatorio Geral
import { RelatorioComponent } from './relatorio/relatorio.component';

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
    
    // Componentes de Relatorio - Impressoes Dentista
    AtestadoDentistaComponent,
    ComprovantePagamentoDentistaComponent,
    HistoricoCompletoDentistaComponent,
    PlanejamentoDentistaComponent,
    PrescricaoDentistaComponent,
    QuestionarioSaudeDentistaComponent,
    RegistroConsultaDentistaComponent,
    ExamesDentistaComponent,
    
    // Componentes de Relatorio - Impressoes Medico
    AtestadoMedicoComponent,
    ComprovantePagamentoMedicoComponent,
    QuestionarioSaudeMedicoComponent,
    HistoricoCompletoMedicoComponent,
    PrescricaoMedicoComponent,
    RegistroConsulataMedicoComponent,
    ExamesMedicosComponent,
    PlanejamentoMedicoComponent,
    
    // Componentes de Relatorio Geral
    RelatorioComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes),
    FormsModule,
  ],
  exports: [RouterModule]
})
export class MedicoModule { }
