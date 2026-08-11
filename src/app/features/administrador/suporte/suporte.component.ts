import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize, Subject, takeUntil } from 'rxjs';

import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';
import { ChamadoSuporteApiService } from 'src/app/services/api/chamado-suporte-api.service';
import {
  CategoriaChamado,
  ChamadoAnexoRequest,
  ChamadoSuporteRequest,
  ChamadoSuporteResponse,
  PrioridadeChamado
} from 'src/app/util/variados/interfaces/suporte/ChamadoSuporte';

/**
 * Anexo preparado para exibicao no modal de detalhes.
 */
interface AnexoVisualizacao {
  nomeArquivo: string;
  url: string;
  tipoConteudo: string;
  renderizavel: boolean;
}

@Component({
  selector: 'app-suporte',
  templateUrl: './suporte.component.html',
  styleUrls: ['./suporte.component.css']
})
export class SuporteComponent implements OnInit, OnDestroy {

  canaisContato = [
    {
      icone: 'fa-solid fa-envelope',
      titulo: 'E-mail',
      valor: 'suporte@saudeconecta.com.br',
      descricao: 'Resposta em até 24 horas'
    },
    {
      icone: 'fa-brands fa-whatsapp',
      titulo: 'WhatsApp',
      valor: '(11) 99999-9999',
      descricao: 'Atendimento rápido'
    }
  ];

  faqRapido = [
    {
      pergunta: 'Como faço para resetar minha senha?',
      resposta: 'Acesse a tela de login e clique em "Esqueci minha senha". Você receberá um e-mail com instruções.'
    },
    {
      pergunta: 'Como cadastrar um novo paciente?',
      resposta: 'No menu lateral, acesse Cadastros > Paciente e preencha o formulário com os dados necessários.'
    },
    {
      pergunta: 'Como cancelar uma consulta agendada?',
      resposta: 'Na tela de Gerenciamento de Agenda, localize a consulta e clique no botão de cancelar.'
    },
    {
      pergunta: 'O sistema está lento, o que fazer?',
      resposta: 'Tente limpar o cache do navegador (Ctrl+Shift+Delete) e recarregar a página.'
    }
  ];

  categorias: Array<{ valor: CategoriaChamado; label: string }> = [
    { valor: 'DUVIDA_TECNICA', label: 'Dúvida técnica' },
    { valor: 'PROBLEMA_SISTEMA', label: 'Problema no sistema' },
    { valor: 'SUGESTAO_MELHORIA', label: 'Sugestão de melhoria' },
    { valor: 'SOLICITACAO_FUNCIONALIDADE', label: 'Solicitação de funcionalidade' },
    { valor: 'OUTROS', label: 'Outros' }
  ];

  prioridades: Array<{ valor: PrioridadeChamado; label: string }> = [
    { valor: 'BAIXA', label: 'Baixa (Dúvida pontual)' },
    { valor: 'MEDIA', label: 'Média (Impacto operacional parcial)' },
    { valor: 'ALTA', label: 'Alta (Impedimento operacional total)' }
  ];

  faqAberto: number | null = null;

  // ===================== Chamados Tecnicos (Tickets) =====================
  chamados: ChamadoSuporteResponse[] = [];

  isCarregandoChamados = false;
  isCarregandoDetalhe = false;
  mostrarModalChamado = false;
  mostrarModalVisualizacao = false;
  mostrarToastChamado = false;
  enviandoChamado = false;
  chamadoSelecionado: ChamadoSuporteResponse | null = null;

  /** Controle de abas no modal de visualizacao */
  abaAtiva: 'escopo' | 'imagens' = 'escopo';

  /** Anexos preparados para exibicao no modal de visualizacao */
  imagensChamado: AnexoVisualizacao[] = [];

  /** Anexos selecionados para o novo chamado */
  anexosNovoChamado: ChamadoAnexoRequest[] = [];

  novoChamado: { titulo: string; corpo: string; categoria: CategoriaChamado | ''; prioridade: PrioridadeChamado | '' } = {
    titulo: '',
    corpo: '',
    categoria: '',
    prioridade: ''
  };

  /** Assinaturas base64 conhecidas para deteccao do formato real do arquivo */
  private static readonly ASSINATURAS_BASE64: Record<string, string> = {
    'iVBORw0KGgo': 'image/png',
    '/9j/': 'image/jpeg',
    'R0lGOD': 'image/gif',
    'UklGR': 'image/webp',
    'SUkq': 'image/tiff',
    'TU0A': 'image/tiff',
    'Qk0': 'image/bmp',
    'PHN2Zy': 'image/svg+xml',
    'JVBERi0': 'application/pdf'
  };

  /** Formatos que o navegador consegue renderizar em uma tag img */
  private static readonly MIMES_RENDERIZAVEIS: string[] = [
    'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private chamadoSuporteApiService: ChamadoSuporteApiService,
    private errorHandler: ErrorHandlerService
  ) { }

  ngOnInit(): void {
    this.carregarChamados();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carrega os chamados da organizacao do usuario autenticado.
   */
  carregarChamados(): void {
    this.isCarregandoChamados = true;

    this.chamadoSuporteApiService.listarTodos()
      .pipe(takeUntil(this.destroy$), finalize(() => this.isCarregandoChamados = false))
      .subscribe({
        next: (pagina) => this.chamados = pagina.content ?? [],
        error: (erro) => this.errorHandler.handleHttpError(erro, 'carregamento dos chamados')
      });
  }

  toggleFaq(index: number): void {
    this.faqAberto = this.faqAberto === index ? null : index;
  }

  abrirModalChamado(): void {
    this.novoChamado = { titulo: '', corpo: '', categoria: '', prioridade: '' };
    this.anexosNovoChamado = [];
    this.mostrarModalChamado = true;
  }

  fecharModalChamado(): void {
    this.mostrarModalChamado = false;
    this.novoChamado = { titulo: '', corpo: '', categoria: '', prioridade: '' };
    this.anexosNovoChamado = [];
  }

  /**
   * Abre o modal de detalhes carregando o chamado completo (com anexos) da API.
   *
   * @param chamado chamado selecionado na listagem
   */
  abrirModalVisualizacao(chamado: ChamadoSuporteResponse): void {
    this.chamadoSelecionado = chamado;
    this.imagensChamado = [];
    this.abaAtiva = 'escopo';
    this.mostrarModalVisualizacao = true;
    this.isCarregandoDetalhe = true;

    this.chamadoSuporteApiService.buscarPorId(chamado.id)
      .pipe(takeUntil(this.destroy$), finalize(() => this.isCarregandoDetalhe = false))
      .subscribe({
        next: (detalhe) => {
          this.chamadoSelecionado = detalhe;
          this.imagensChamado = (detalhe.anexos ?? []).map(anexo => this.montarAnexoVisualizacao(anexo.nomeArquivo, anexo.conteudoBase64));
        },
        error: (erro) => this.errorHandler.handleHttpError(erro, 'carregamento do chamado')
      });
  }

  fecharModalVisualizacao(): void {
    this.mostrarModalVisualizacao = false;
    this.chamadoSelecionado = null;
    this.abaAtiva = 'escopo';
    this.imagensChamado = [];
  }

  mudarAba(aba: 'escopo' | 'imagens'): void {
    this.abaAtiva = aba;
  }

  /**
   * Converte os arquivos selecionados em anexos base64 para envio ao backend.
   *
   * @param event evento de selecao do input file
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) {
      return;
    }

    Array.from(input.files).forEach(arquivo => {
      const leitor = new FileReader();
      leitor.onload = () => {
        this.anexosNovoChamado.push({
          nomeArquivo: arquivo.name,
          tipoConteudo: arquivo.type || null,
          conteudoBase64: leitor.result as string
        });
      };
      leitor.readAsDataURL(arquivo);
    });

    input.value = '';
  }

  /**
   * Remove um anexo ainda nao enviado.
   *
   * @param index posicao do anexo na lista
   */
  removerImagem(index: number): void {
    this.anexosNovoChamado.splice(index, 1);
  }

  /**
   * Cadastra o chamado na API e recarrega a listagem.
   */
  enviarChamado(): void {
    if (!this.novoChamado.titulo?.trim()
      || !this.novoChamado.categoria
      || !this.novoChamado.prioridade
      || !this.novoChamado.corpo?.trim()) {
      return;
    }

    this.enviandoChamado = true;

    const request: ChamadoSuporteRequest = {
      titulo: this.novoChamado.titulo.trim(),
      corpo: this.novoChamado.corpo.trim(),
      categoria: this.novoChamado.categoria,
      prioridade: this.novoChamado.prioridade,
      anexos: this.anexosNovoChamado
    };

    this.chamadoSuporteApiService.cadastrar(request)
      .pipe(takeUntil(this.destroy$), finalize(() => this.enviandoChamado = false))
      .subscribe({
        next: (chamado) => {
          this.chamados = [chamado, ...this.chamados];
          this.fecharModalChamado();
          this.exibirToast();
        },
        error: (erro) => this.errorHandler.handleHttpError(erro, 'abertura do chamado')
      });
  }

  /**
   * Exclui um chamado da organizacao atual.
   *
   * @param chamado chamado a ser removido
   */
  excluirChamado(chamado: ChamadoSuporteResponse): void {
    this.chamadoSuporteApiService.deletar(chamado.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.chamados = this.chamados.filter(item => item.id !== chamado.id);
          this.errorHandler.showSuccessToast('Chamado excluido com sucesso');
        },
        error: (erro) => this.errorHandler.handleHttpError(erro, 'exclusao do chamado')
      });
  }

  /**
   * Prepara um anexo para exibicao, detectando o mime real pelo conteudo base64.
   * O mime informado no upload pode divergir do formato real do arquivo.
   *
   * @param nomeArquivo    nome original do arquivo
   * @param conteudoBase64 conteudo base64 retornado pela API
   * @returns anexo com data URL e indicacao de suporte do navegador
   */
  private montarAnexoVisualizacao(nomeArquivo: string, conteudoBase64: string): AnexoVisualizacao {
    const base64Puro = conteudoBase64.startsWith('data:')
      ? conteudoBase64.substring(conteudoBase64.indexOf('base64,') + 'base64,'.length)
      : conteudoBase64;

    const tipoConteudo = this.detectarMimeType(base64Puro);

    return {
      nomeArquivo,
      url: `data:${tipoConteudo};base64,${base64Puro}`,
      tipoConteudo,
      renderizavel: SuporteComponent.MIMES_RENDERIZAVEIS.includes(tipoConteudo)
    };
  }

  /**
   * Detecta o mime type de um arquivo a partir da assinatura do conteudo base64.
   *
   * @param base64 conteudo base64 puro
   * @returns mime type identificado ou application/octet-stream
   */
  private detectarMimeType(base64: string): string {
    const assinatura = Object.keys(SuporteComponent.ASSINATURAS_BASE64)
      .find(prefixo => base64.startsWith(prefixo));

    return assinatura ? SuporteComponent.ASSINATURAS_BASE64[assinatura] : 'application/octet-stream';
  }

  /**
   * Exibe o toast de sucesso por alguns segundos.
   */
  private exibirToast(): void {
    this.mostrarToastChamado = true;
    setTimeout(() => this.mostrarToastChamado = false, 3000);
  }
}
