import { Component, OnInit } from '@angular/core';

export type PrioridadeChamado = 'Alta' | 'Média' | 'Baixa';
export type StatusChamado = 'EM ANÁLISE' | 'EM ANDAMENTO' | 'CONCLUÍDO';

export interface ChamadoSuporte {
  id: string;
  assunto: string;
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
      descricao: 'Resposta em até 24 horas',
      cor: '#00d9ff'
    },
    {
      icone: 'fa-solid fa-phone',
      titulo: 'Telefone',
      valor: '(11) 99999-9999',
      descricao: 'Seg a Sex, 8h às 18h',
      cor: '#00ff88'
    },
    {
      icone: 'fa-brands fa-whatsapp',
      titulo: 'WhatsApp',
      valor: '(11) 99999-9999',
      descricao: 'Atendimento rápido',
      cor: '#25d366'
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
      assunto: 'Falha ao exportar relatório financeiro em PDF',
      categoria: 'Módulo de Faturamento',
      prioridade: 'Alta',
      status: 'EM ANDAMENTO',
      data: 'Ontem, 14:32'
    },
    {
      id: '#SC-9037',
      assunto: 'Dúvida sobre permissões de secretária',
      categoria: 'Acesso e Segurança',
      prioridade: 'Baixa',
      status: 'CONCLUÍDO',
      data: '05/08/2026, 09:15'
    }
  ];

  mostrarModalChamado = false;
  mostrarToastChamado = false;
  enviandoChamado = false;

  novoChamado = {
    assunto: '',
    prioridade: '',
    mensagem: ''
  };

  constructor() { }

  ngOnInit(): void { }

  toggleFaq(index: number): void {
    this.faqAberto = this.faqAberto === index ? null : index;
  }

  abrirModalChamado(): void {
    this.mostrarModalChamado = true;
  }

  fecharModalChamado(): void {
    this.mostrarModalChamado = false;
    this.novoChamado = { assunto: '', prioridade: '', mensagem: '' };
  }

  enviarChamado(): void {
    if (!this.novoChamado.assunto || !this.novoChamado.prioridade || !this.novoChamado.mensagem.trim()) {
      return;
    }

    this.enviandoChamado = true;

    // Simulação local (frontend-only). Integração com backend será feita futuramente.
    setTimeout(() => {
      const numero = Math.floor(9000 + Math.random() * 1000);
      const chamado: ChamadoSuporte = {
        id: `#SC-${numero}`,
        assunto: this.novoChamado.assunto,
        categoria: this.novoChamado.assunto,
        prioridade: this.novoChamado.prioridade as PrioridadeChamado,
        status: 'EM ANÁLISE',
        data: 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      this.chamados = [chamado, ...this.chamados];
      this.enviandoChamado = false;
      this.mostrarModalChamado = false;
      this.novoChamado = { assunto: '', prioridade: '', mensagem: '' };

      this.mostrarToastChamado = true;
      setTimeout(() => this.mostrarToastChamado = false, 3000);
    }, 800);
  }
}
