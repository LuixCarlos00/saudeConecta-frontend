import { Component, EventEmitter, Input, Output } from '@angular/core';


import {
  DenteResponse,
  HistoricoCompletoPacienteResponse,
  PlanejamentoResponse,
} from 'src/app/shared/models/historico-completo-paciente-response.interface';
import { formatarDataBr } from 'src/app/shared/utils/data-local';
import { nomeComTitulo } from 'src/app/shared/utils/titulo-profissional';

/** Rótulo + valor de um campo de texto livre do prontuário. */
interface CampoTexto {
  rotulo: string;
  valor: string | null | undefined;
}

/** Bloco de campos com título; só é exibido quando algum campo tem valor. */
interface GrupoCampos {
  titulo: string;
  icone: string;
  campos: CampoTexto[];
}

const LABEL_DENTE: Record<string, string> = {
  sadio: 'Sadio', cariado: 'Cariado', obturado: 'Obturado', ausente: 'Ausente',
  protese: 'Prótese', canal: 'Canal', fratura: 'Fratura', implante: 'Implante',
};

/**
 * Card de um registro do histórico do paciente na aba "Histórico" do atendimento
 * (médico e dentista). Mostra o mesmo conjunto de campos do relatório "Histórico
 * Completo", para que as duas telas não voltem a divergir.
 *
 * Recebe um item de GET /consultas/BuscandoHistoricoDeConsultasDoPaciente/{pacienteId}.
 */
@Component({
  selector: 'app-historico-registro-card',
  templateUrl: './historico-registro-card.component.html',
  styleUrl: './historico-registro-card.component.scss',
})
export class HistoricoRegistroCardComponent {

  /** Registro do histórico (consulta + prontuário médico ou odontológico). */
  @Input({ required: true }) registro!: HistoricoCompletoPacienteResponse;

  /** Pedido de edição do prontuário deste registro (a tela que hospeda abre o dialog). */
  @Output() editar = new EventEmitter<HistoricoCompletoPacienteResponse>();

  /**
   * O usuário logado é o dono do prontuário deste registro? Quem hospeda o card decide
   * (EdicaoProntuarioService.ehDonoDoProntuario), para o card seguir só de apresentação.
   */
  @Input() ehDonoDoProntuario = false;

  /**
   * Só o profissional dono do prontuário edita (contrato §1). Item sem prontuário gravado
   * não mostra o botão. O back ainda valida o dono no PUT (404 para os demais).
   */
  get podeEditar(): boolean {
    return !!this.registro?.codigoProntuario && this.ehDonoDoProntuario;
  }

  get isDentista(): boolean {
    return this.registro?.tipoProntuario?.toUpperCase() === 'DENTISTA';
  }

  /** "dd/MM/yyyy às HH:mm" da consulta; cai na data de finalização se não houver data/hora. */
  get dataConsulta(): string {
    const dh = this.registro?.dataHora;
    if (dh) {
      const data = formatarDataBr(dh, '');
      const hora = /T(\d{2}:\d{2})/.exec(dh)?.[1];
      return hora ? `${data} às ${hora}` : data;
    }
    return this.dataBr(this.registro?.dataFinalizado || this.registro?.dataFinalizadoDentista);
  }

  /** Tempo real do atendimento (cronômetro do prontuário) e, se houver, a duração agendada. */
  get duracao(): string {
    const real = this.registro?.tempoDuracao;
    const agendada = this.registro?.duracaoMinutos ? `${this.registro.duracaoMinutos} min agendados` : '';
    if (real && agendada) return `${real} · ${agendada}`;
    return real || agendada || '—';
  }

  get profissional(): string {
    return nomeComTitulo(this.registro?.profissionalNome, '');
  }

  get rotuloConselho(): string {
    return this.isDentista ? 'CRO' : 'CRM';
  }

  /** Sinais vitais com unidade; só os preenchidos. */
  get sinaisVitais(): CampoTexto[] {
    const r = this.registro;
    const com = (v: string | undefined, unidade: string) => (v ? `${v}${unidade}` : v);
    return [
      { rotulo: 'PA', valor: r.pressao },
      { rotulo: 'Pulso', valor: com(r.pulso, ' bpm') },
      { rotulo: 'Temp.', valor: com(r.temperatura, ' °C') },
      { rotulo: 'Peso', valor: com(r.peso, ' kg') },
      { rotulo: 'Altura', valor: com(r.altura, ' m') },
      { rotulo: 'SpO₂', valor: com(r.saturacao, '%') },
      { rotulo: 'Hb', valor: com(r.hemoglobina, ' g/dL') },
      { rotulo: 'Fr. Resp.', valor: com(r.frequenciaRespiratoria, ' irpm') },
      { rotulo: 'PA Sist.', valor: r.frequenciaArterialSistolica },
      { rotulo: 'PA Diast.', valor: r.frequenciaArterialDiastolica },
    ].filter(c => !!c.valor);
  }

  /** Blocos de texto do prontuário, na ordem clínica; os vazios somem do template. */
  get grupos(): GrupoCampos[] {
    const r = this.registro;
    const grupos: GrupoCampos[] = [
      {
        titulo: 'Avaliação', icone: 'fa-stethoscope', campos: [
          { rotulo: 'Responsável', valor: r.responsavel },
          { rotulo: 'Queixa principal', valor: r.queixaPrincipal },
          { rotulo: 'Anamnese', valor: r.anamnese },
          { rotulo: 'Exame físico', valor: r.exame },
          { rotulo: 'Diagnóstico', valor: r.diagnostico },
          { rotulo: 'CID', valor: r.cidTexto },
          { rotulo: 'Conduta', valor: r.conduta },
        ],
      },
    ];
    if (this.isDentista) {
      grupos.push(
        {
          titulo: 'Exame extraoral', icone: 'fa-user', campos: [
            { rotulo: 'Fácies', valor: r.facies },
            { rotulo: 'Linfonodos', valor: r.linfonodos },
            { rotulo: 'ATM', valor: r.atm },
            { rotulo: 'Edema', valor: r.edema },
          ],
        },
        {
          titulo: 'Exame intraoral', icone: 'fa-tooth', campos: [
            { rotulo: 'Lábios', valor: r.labios },
            { rotulo: 'Língua', valor: r.lingua },
            { rotulo: 'Gengiva', valor: r.gengiva },
            { rotulo: 'Mucosas', valor: r.mucosas },
            { rotulo: 'Palato', valor: r.palato },
            { rotulo: 'Orofaringe', valor: r.orofaringe },
            { rotulo: 'Soalho bucal', valor: r.soalhoBucal },
            { rotulo: 'Higiene bucal', valor: r.higieneBucal },
            { rotulo: 'Condição gengival', valor: r.condicaoGengival },
            { rotulo: 'Oclusal', valor: r.oclusal },
            { rotulo: 'Portador de aparelho', valor: r.portadorAparelho },
            { rotulo: 'Hábitos nocivos', valor: r.habitosNocivos },
          ],
        },
        {
          titulo: 'Tratamento', icone: 'fa-list-check', campos: [
            { rotulo: 'Plano de tratamento', valor: r.planoTratamento },
            { rotulo: 'Procedimentos', valor: r.procedimentos },
            { rotulo: 'Início', valor: this.dataOuVazio(r.inicioTratamento) },
            { rotulo: 'Término', valor: this.dataOuVazio(r.terminoTratamento) },
            { rotulo: 'Interrupção', valor: r.interrupcao },
          ],
        },
      );
    }
    grupos.push({
      titulo: 'Conduta e orientações', icone: 'fa-prescription', campos: [
        { rotulo: this.rotuloPrescricao, valor: r.prescricao },
        { rotulo: 'Orientações ao paciente', valor: r.orientacoes },
        { rotulo: 'Solicitação de exames', valor: r.solicitacaoExameTexto },
        { rotulo: 'TUSS', valor: r.tussTexto },
        { rotulo: 'Outros exames', valor: r.exameOutros },
        { rotulo: 'Observações', valor: r.observacao },
        { rotulo: 'Obs. da consulta', valor: r.observacoes },
      ],
    });
    return grupos
      .map(g => ({ ...g, campos: g.campos.filter(c => !!c.valor?.toString().trim()) }))
      .filter(g => g.campos.length > 0);
  }

  /** "Prescrição — <título> (dd/MM/yyyy)", igual ao Histórico Completo. */
  get rotuloPrescricao(): string {
    const titulo = this.registro?.tituloPrescricao?.trim();
    const data = this.dataOuVazio(this.registro?.dataPrescricao);
    return `Prescrição${titulo ? ' — ' + titulo : ''}${data ? ' (' + data + ')' : ''}`;
  }

  get dentes(): DenteResponse[] {
    return this.registro?.dentes ?? [];
  }

  get planejamentos(): PlanejamentoResponse[] {
    return this.registro?.planejamentos ?? [];
  }

  get totalPlanejamentos(): number {
    return this.planejamentos.reduce((soma, p) => soma + Number(p.valor || 0), 0);
  }

  get dataFinalizacao(): string {
    return this.dataOuVazio(this.registro?.dataFinalizado || this.registro?.dataFinalizadoDentista);
  }

  labelDente(status: string): string {
    return LABEL_DENTE[status?.toLowerCase()] ?? status;
  }

  /**
   * Data-sem-hora da API ('yyyy-MM-dd') em dd/MM/yyyy.
   *
   * @param data data como vem da API
   * @returns data formatada, ou '-' quando ausente/inválida
   */
  dataBr(data: string | null | undefined): string {
    return formatarDataBr(data, '-');
  }

  private dataOuVazio(data: string | null | undefined): string {
    return formatarDataBr(data, data ?? '');
  }
}
