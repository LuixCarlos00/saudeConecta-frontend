import { Component, OnInit } from '@angular/core';

export type PrioridadeChamado = 'Alta' | 'Média' | 'Baixa';
export type StatusChamado = 'EM ANÁLISE' | 'EM ANDAMENTO' | 'CONCLUÍDO';

export interface ChamadoSuporte {
  id: string;
  titulo: string;
  corpo: string;
  categoria: string;
  prioridade: PrioridadeChamado;
  status: StatusChamado;
  data: string;
}

@Component({
  selector: 'app-suporte',
  templateUrl: './suporte.component.html',
  styleUrls: ['./suporte.component.css']
})
export class SuporteComponent implements OnInit {

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

  assuntos = [
    'Dúvida técnica',
    'Problema no sistema',
    'Sugestão de melhoria',
    'Solicitação de funcionalidade',
    'Outros'
  ];

  prioridades = [
    { valor: 'Baixa', label: 'Baixa (Dúvida pontual)' },
    { valor: 'Média', label: 'Média (Impacto operacional parcial)' },
    { valor: 'Alta', label: 'Alta (Impedimento operacional total)' }
  ];

  faqAberto: number | null = null;

  // ===================== Chamados Técnicos (Tickets) =====================
  chamados: ChamadoSuporte[] = [
    {
      id: '#SC-9042',
      titulo: 'Falha ao exportar relatório financeiro em PDF',
      corpo: 'O sistema apresenta erro ao tentar exportar o relatório financeiro em formato PDF. A mensagem de erro indica um problema no módulo de geração de documentos. O sistema apresenta erro ao tentar exportar o relatório financeiro em formato PDF. A mensagem de erro indica um problema no módulo de geração de documentos. O sistema apresenta erro ao tentar exportar o relatório financeiro em formato PDF. A mensagem de erro indica um problema no módulo de geração de documentos.',
      categoria: 'Módulo de Faturamento',
      prioridade: 'Alta',
      status: 'EM ANDAMENTO',
      data: 'Ontem, 14:32'
    },
    {
      id: '#SC-9037',
      titulo: 'Dúvida sobre permissões de secretária',
      corpo: 'Gostaria de saber quais permissões a secretária tem acesso no sistema. Preciso configurar o perfil de uma nova funcionária.',
      categoria: 'Acesso e Segurança',
      prioridade: 'Baixa',
      status: 'CONCLUÍDO',
      data: '05/08/2026, 09:15'
    }
  ];

  mostrarModalChamado = false;
  mostrarModalVisualizacao = false;
  mostrarToastChamado = false;
  enviandoChamado = false;
  chamadoSelecionado: ChamadoSuporte | null = null;

  // Controle de abas no modal de visualização
  abaAtiva: 'escopo' | 'imagens' = 'escopo';

  // Upload de imagens
  imagensChamado: string[] = [];
  imagemParaUpload: File | null = null;
  previewImagem: string | null = null;

  novoChamado = {
    titulo: '',
    corpo: '',
    prioridade: ''
  };

  constructor() { }

  ngOnInit(): void { }

  toggleFaq(index: number): void {
    this.faqAberto = this.faqAberto === index ? null : index;
  }

  abrirModalChamado(): void {
    // Pre-fill with mock data for testing
    this.novoChamado = {
      titulo: 'Problema no sistema',
      corpo: 'Estou enfrentando dificuldades ao acessar o módulo de agendamento. O sistema apresenta erro ao tentar salvar novas consultas.',
      prioridade: 'Média'
    };
    this.mostrarModalChamado = true;
  }

  abrirModalVisualizacao(chamado: ChamadoSuporte): void {
    this.chamadoSelecionado = chamado;
    this.mostrarModalVisualizacao = true;
  }

  fecharModalVisualizacao(): void {
    this.mostrarModalVisualizacao = false;
    this.chamadoSelecionado = null;
    this.abaAtiva = 'escopo';
    this.imagensChamado = [];
    this.imagemParaUpload = null;
    this.previewImagem = null;
  }

  mudarAba(aba: 'escopo' | 'imagens'): void {
    this.abaAtiva = aba;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const previewUrl = URL.createObjectURL(file);
        this.imagensChamado.push(previewUrl);
      }
    }
  }

  removerPreview(): void {
    this.imagemParaUpload = null;
    this.previewImagem = null;
  }

  adicionarImagem(): void {
    if (this.previewImagem) {
      this.imagensChamado.push(this.previewImagem);
      this.removerPreview();
    }
  }

  removerImagem(index: number): void {
    this.imagensChamado.splice(index, 1);
  }

  fecharModalChamado(): void {
    this.mostrarModalChamado = false;
    this.novoChamado = { titulo: '', corpo: '', prioridade: '' };
  }

  enviarChamado(): void {
    if (!this.novoChamado.titulo || !this.novoChamado.prioridade || !this.novoChamado.corpo.trim()) {
      return;
    }

    this.enviandoChamado = true;

    // Simulação local (frontend-only). Integração com backend será feita futuramente.
    setTimeout(() => {
      const numero = Math.floor(9000 + Math.random() * 1000);
      const chamado: ChamadoSuporte = {
        id: `#SC-${numero}`,
        titulo: this.novoChamado.titulo,
        corpo: this.novoChamado.corpo,
        categoria: 'Geral',
        prioridade: this.novoChamado.prioridade as PrioridadeChamado,
        status: 'EM ANÁLISE',
        data: 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      this.chamados = [chamado, ...this.chamados];
      this.enviandoChamado = false;
      this.mostrarModalChamado = false;
      this.novoChamado = { titulo: '', corpo: '', prioridade: '' };

      this.mostrarToastChamado = true;
      setTimeout(() => this.mostrarToastChamado = false, 3000);
    }, 800);
  }
}
