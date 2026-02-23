import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sobre',
  templateUrl: './sobre.component.html',
  styleUrls: ['./sobre.component.css']
})
export class SobreComponent implements OnInit {

  versao = '2.0.0';
  dataAtualizacao = '04/02/2026';

  tecnologias = [
    { nome: 'Angular', versao: '17.x', icone: 'fa-brands fa-angular', cor: '#dd0031' },
    { nome: 'Spring Boot', versao: '3.x', icone: 'fa-brands fa-java', cor: '#6db33f' },
    { nome: 'PostgreSQL', versao: '15.x', icone: 'fa-solid fa-database', cor: '#336791' },
    { nome: 'TypeScript', versao: '5.x', icone: 'fa-brands fa-js', cor: '#3178c6' }
  ];

  funcionalidades = [
    { titulo: 'Gestão de Agenda', descricao: 'Agendamento completo de consultas e procedimentos', icone: 'fa-solid fa-calendar-check' },
    { titulo: 'Prontuário Eletrônico', descricao: 'Registro digital do histórico do paciente', icone: 'fa-solid fa-file-medical' },
    { titulo: 'Gestão de Usuários', descricao: 'Controle de acesso para médicos, secretárias e administradores', icone: 'fa-solid fa-users-gear' },
    { titulo: 'Dashboard Analítico', descricao: 'Métricas e indicadores de desempenho', icone: 'fa-solid fa-chart-line' },
    { titulo: 'Notificações', descricao: 'Alertas e lembretes automáticos', icone: 'fa-solid fa-bell' },
    { titulo: 'Relatórios', descricao: 'Geração de relatórios personalizados', icone: 'fa-solid fa-file-pdf' }
  ];

  equipe = [
    { nome: 'Equipe Sentinela', cargo: 'Desenvolvimento', avatar: 'fa-solid fa-code' }
  ];

  constructor() { }

  ngOnInit(): void { }
}
