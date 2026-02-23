import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  isScrolled = false;
  mobileMenuOpen = false;
  activeAccordion: number | null = null;

  funcionalidades = [
    {
      icon: 'fa-calendar-check',
      titulo: 'Agendamento Online',
      descricao: 'Agende consultas de forma rápida e prática, 24 horas por dia.'
    },
    {
      icon: 'fa-user-doctor',
      titulo: 'Gestão de Médicos',
      descricao: 'Controle completo da agenda e histórico de atendimentos dos profissionais.'
    },
    {
      icon: 'fa-users',
      titulo: 'Cadastro de Pacientes',
      descricao: 'Prontuário eletrônico com histórico completo de consultas e exames.'
    },
    {
      icon: 'fa-chart-line',
      titulo: 'Relatórios e Métricas',
      descricao: 'Dashboards intuitivos com indicadores de desempenho da clínica.'
    },
    {
      icon: 'fa-bell',
      titulo: 'Notificações Automáticas',
      descricao: 'Lembretes por e-mail e SMS para pacientes e equipe médica.'
    },
    {
      icon: 'fa-shield-halved',
      titulo: 'Segurança de Dados',
      descricao: 'Proteção total dos dados seguindo normas LGPD e padrões de segurança.'
    }
  ];

  publicoAlvo = [
    {
      icon: 'fa-hospital',
      titulo: 'Clínicas Médicas',
      descricao: 'Ideal para clínicas de pequeno a grande porte.'
    },
    {
      icon: 'fa-stethoscope',
      titulo: 'Consultórios',
      descricao: 'Perfeito para profissionais autônomos.'
    },
    {
      icon: 'fa-building',
      titulo: 'Centros de Saúde',
      descricao: 'Solução completa para centros médicos.'
    },
    {
      icon: 'fa-tooth',
      titulo: 'Especialidades',
      descricao: 'Adapta-se a qualquer especialidade médica.'
    }
  ];

  beneficios = [
    { texto: 'Redução de até 70% no tempo de agendamento' },
    { texto: 'Diminuição de faltas com lembretes automáticos' },
    { texto: 'Acesso de qualquer lugar, a qualquer hora' },
    { texto: 'Integração completa entre setores' },
    { texto: 'Suporte técnico especializado' },
    { texto: 'Atualizações constantes sem custo adicional' }
  ];

  depoimentos = [
    {
      nome: 'Dra. Maria Silva',
      cargo: 'Cardiologista',
      clinica: 'Clínica Coração Saudável',
      foto: 'https://randomuser.me/api/portraits/women/44.jpg',
      texto: 'O Saúde Conecta transformou a gestão da minha clínica. A agenda ficou muito mais organizada e os pacientes adoram a facilidade de agendamento online.'
    },
    {
      nome: 'Dr. Carlos Santos',
      cargo: 'Diretor Clínico',
      clinica: 'Centro Médico Vida',
      foto: 'https://randomuser.me/api/portraits/men/32.jpg',
      texto: 'Implementamos o sistema há 6 meses e já vimos uma redução de 50% nas faltas. O investimento se pagou rapidamente.'
    },
    {
      nome: 'Ana Paula Oliveira',
      cargo: 'Administradora',
      clinica: 'Policlínica São Lucas',
      foto: 'https://randomuser.me/api/portraits/women/68.jpg',
      texto: 'A equipe de suporte é excepcional. Sempre que precisamos de ajuda, somos atendidos rapidamente. Recomendo!'
    }
  ];

  faq = [
    {
      pergunta: 'Como funciona o período de teste?',
      resposta: 'Oferecemos 14 dias gratuitos com acesso completo a todas as funcionalidades. Não é necessário cartão de crédito para começar.'
    },
    {
      pergunta: 'O sistema funciona em dispositivos móveis?',
      resposta: 'Sim! O Saúde Conecta é totalmente responsivo e funciona perfeitamente em smartphones, tablets e computadores.'
    },
    {
      pergunta: 'Como é feita a migração dos dados?',
      resposta: 'Nossa equipe técnica auxilia na importação dos dados do seu sistema atual, garantindo uma transição suave e sem perda de informações.'
    },
    {
      pergunta: 'O sistema atende às normas da LGPD?',
      resposta: 'Sim, seguimos rigorosamente todas as diretrizes da Lei Geral de Proteção de Dados, garantindo a segurança e privacidade das informações.'
    },
    {
      pergunta: 'Posso cancelar a qualquer momento?',
      resposta: 'Sim, não há fidelidade. Você pode cancelar sua assinatura a qualquer momento sem multas ou taxas adicionais.'
    }
  ];

  planos = [
    {
      nome: 'Starter',
      preco: 149,
      descricao: 'Ideal para consultórios individuais',
      recursos: [
        'Até 2 profissionais',
        'Agendamento online',
        'Cadastro de pacientes',
        'Prontuário eletrônico',
        'Suporte por e-mail'
      ],
      destaque: false
    },
    {
      nome: 'Profissional',
      preco: 299,
      descricao: 'Perfeito para clínicas em crescimento',
      recursos: [
        'Até 10 profissionais',
        'Todas as funções do Starter',
        'Relatórios avançados',
        'Notificações SMS',
        'Suporte prioritário',
        'Integração com laboratórios'
      ],
      destaque: true
    },
    {
      nome: 'Enterprise',
      preco: 599,
      descricao: 'Para grandes centros médicos',
      recursos: [
        'Profissionais ilimitados',
        'Todas as funções anteriores',
        'API personalizada',
        'Gerente de conta dedicado',
        'Treinamento presencial',
        'SLA garantido'
      ],
      destaque: false
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleAccordion(index: number) {
    this.activeAccordion = this.activeAccordion === index ? null : index;
  }

  navegarParaLogin() {
    this.router.navigate(['/login']);
  }

  scrollToSection(sectionId: string) {
    this.mobileMenuOpen = false;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
