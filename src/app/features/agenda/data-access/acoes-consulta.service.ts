import { Injectable } from '@angular/core';
import { Observable, takeUntil } from 'rxjs';
import { ProntuarioApiService } from 'src/app/core/data-access/prontuario-api.service';
import { ProntuarioDentistaApiService } from 'src/app/core/data-access/prontuario-dentista-api.service';
import { RelatorioService } from 'src/app/features/relatorios';
import { Consultav2 } from 'src/app/shared/models/consultav2';

/**
 * Ações sobre uma consulta compartilhadas pelas duas agendas (lista e calendário):
 * prontuário mais recente, selos de "planejamento assinado" / "questionário respondido"
 * e o link de confirmação por WhatsApp.
 *
 * Não guarda estado: quem chama passa a lista de consultas e o Set que deve ser preenchido.
 */
@Injectable({
  providedIn: 'root'
})
export class AcoesConsultaService {

  constructor(
    private relatorioService: RelatorioService,
    private prontuarioApiService: ProntuarioApiService,
    private prontuarioDentistaApiService: ProntuarioDentistaApiService
  ) { }

  /**
   * Busca o prontuário mais recente da consulta de acordo com o tipo de profissional.
   * Dentista: usa ProntuarioDentistaApiService (retorna campo "codigo").
   * Médico: usa ProntuarioApiService (retorna campo "codigoProntuario").
   *
   * @param consulta consulta de referência
   * @returns prontuário mais recente da consulta
   */
  buscarProntuarioMaisRecente(consulta: Consultav2): Observable<any> {
    const tipo = this.relatorioService.detectarTipoProfissional(consulta);
    if (tipo === 'DENTISTA') {
      return this.prontuarioDentistaApiService.buscarProntuarioDentistaById(consulta.id);
    }
    return this.prontuarioApiService.buscarMaisRecentePorConsulta(consulta.id);
  }

  /**
   * Extrai o ID do prontuário independente do tipo (dentista: "codigo", médico: "codigoProntuario").
   *
   * @param prontuario prontuário retornado por buscarProntuarioMaisRecente
   * @returns ID do prontuário, ou null se não houver
   */
  extrairCodigoProntuario(prontuario: any): number | null {
    return prontuario?.codigo ?? prontuario?.codigoProntuario ?? null;
  }

  /**
   * Marca em `assinados` as consultas REALIZADAS cujos planejamentos estão todos assinados.
   *
   * @param consultas consultas exibidas na agenda
   * @param assinados Set de IDs a preencher (IDs já presentes não são consultados de novo)
   * @param ate$ encerra as requisições pendentes (destroy$ do componente)
   * @param aoMarcar chamado depois de cada ID adicionado, com um Set NOVO (para componentes OnPush perceberem a mudança)
   */
  verificarPlanejamentosAssinados(
    consultas: Consultav2[],
    assinados: Set<number>,
    ate$: Observable<void>,
    aoMarcar: (novos: Set<number>) => void = () => {}
  ): void {
    const finalizadas = consultas.filter(c => c.status === 'REALIZADA');
    for (const consulta of finalizadas) {
      if (!consulta?.id || assinados.has(consulta.id)) continue;
      this.buscarProntuarioMaisRecente(consulta)
        .pipe(takeUntil(ate$))
        .subscribe({
          next: (prontuario: any) => {
            const plans = prontuario?.planejamentosTerapeuticos || prontuario?.planejamentos || [];
            if (plans.length > 0 && plans.every((p: any) => p.statusAssinatura === 'ASSINADO')) {
              assinados.add(consulta.id);
              aoMarcar(new Set(assinados));
            }
          }
        });
    }
  }

  /**
   * Marca em `respondidos` as consultas CONFIRMADAS cujo questionário de saúde já foi respondido.
   *
   * @param consultas consultas exibidas na agenda
   * @param respondidos Set de IDs a preencher (IDs já presentes não são consultados de novo)
   * @param ate$ encerra as requisições pendentes (destroy$ do componente)
   * @param aoMarcar chamado depois de cada ID adicionado, com um Set NOVO (para componentes OnPush perceberem a mudança)
   */
  verificarQuestionariosRespondidos(
    consultas: Consultav2[],
    respondidos: Set<number>,
    ate$: Observable<void>,
    aoMarcar: (novos: Set<number>) => void = () => {}
  ): void {
    const confirmadas = consultas.filter(c => c.status === 'CONFIRMADA');
    for (const consulta of confirmadas) {
      if (!consulta?.id || respondidos.has(consulta.id)) continue;
      this.prontuarioDentistaApiService.buscarQuestionarioSaude(consulta.id)
        .pipe(takeUntil(ate$))
        .subscribe({
          next: (resp: any) => {
            if (resp?.respondido) {
              respondidos.add(consulta.id);
              aoMarcar(new Set(respondidos));
            }
          }
        });
    }
  }

  /**
   * Gera o link do WhatsApp (wa.me) com a mensagem de confirmação da consulta.
   *
   * @param consulta consulta com telefone do paciente
   * @returns URL wa.me com a mensagem codificada, ou '' se não houver telefone
   */
  gerarLinkWhatsApp(consulta: Consultav2 | null | undefined): string {
    if (!consulta?.pacienteTelefone) { return ''; }
    const telefone = this.formatarTelefoneWhatsApp(consulta.pacienteTelefone);
    const mensagem = this.gerarMensagemWhatsApp(consulta);
    return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
  }

  /**
   * Gera a mensagem de confirmação de consulta com dados dinâmicos.
   *
   * @param consulta dados da consulta
   * @returns mensagem com nome do paciente, profissional, data e horário
   */
  gerarMensagemWhatsApp(consulta: Consultav2): string {
    const dataHora = new Date(consulta.dataHora);
    const data = dataHora.toLocaleDateString('pt-BR');
    const horario = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const paciente = consulta.pacienteNome || 'Paciente';
    const medico = consulta.profissionalNome || 'Profissional';
    return `Olá ${paciente}, tudo bem?\n\nGostaríamos de confirmar sua consulta com ${medico} no dia ${data} às ${horario}.\n\nPor favor, confirme sua presença respondendo esta mensagem.\n\nAtenciosamente,\nEquipe da Clínica.`;
  }

  /**
   * Formata o telefone no padrão internacional brasileiro (só dígitos, com 55 na frente).
   *
   * @param telefone telefone em qualquer formato
   * @returns número com o código 55 do Brasil
   */
  formatarTelefoneWhatsApp(telefone: string): string {
    const numeros = telefone.replace(/\D/g, '');
    return numeros.startsWith('55') ? numeros : '55' + numeros;
  }
}
