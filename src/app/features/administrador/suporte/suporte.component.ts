import { Component, OnInit } from '@angular/core';

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

  linksUteis = [
    { titulo: 'Manual do Usuário', icone: 'fa-solid fa-book', url: '#' },
    { titulo: 'Vídeos Tutoriais', icone: 'fa-solid fa-video', url: '#' },
    { titulo: 'Base de Conhecimento', icone: 'fa-solid fa-lightbulb', url: '#' },
    { titulo: 'Novidades do Sistema', icone: 'fa-solid fa-newspaper', url: '#' }
  ];

  formContato = {
    assunto: '',
    mensagem: ''
  };

  assuntos = [
    'Dúvida técnica',
    'Problema no sistema',
    'Sugestão de melhoria',
    'Solicitação de funcionalidade',
    'Outros'
  ];

  faqAberto: number | null = null;
  enviando = false;
  mensagemEnviada = false;

  constructor() { }

  ngOnInit(): void { }

  toggleFaq(index: number): void {
    this.faqAberto = this.faqAberto === index ? null : index;
  }

  enviarMensagem(): void {
    if (!this.formContato.assunto || !this.formContato.mensagem) {
      return;
    }

    this.enviando = true;

    setTimeout(() => {
      this.enviando = false;
      this.mensagemEnviada = true;
      this.formContato = { assunto: '', mensagem: '' };

      setTimeout(() => {
        this.mensagemEnviada = false;
      }, 5000);
    }, 1500);
  }
}
