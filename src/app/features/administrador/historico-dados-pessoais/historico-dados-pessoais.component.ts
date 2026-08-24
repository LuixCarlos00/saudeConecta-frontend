import { Component, OnInit } from '@angular/core';
import { HistoricoDadosPessoaisApiService } from 'src/app/services/api/historico-dados-pessoais-api.service';
import { HistoricoDadosPessoais } from 'src/app/util/variados/interfaces/historico-dados-pessoais/historico-dados-pessoais';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-historico-dados-pessoais',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historico-dados-pessoais.component.html',
  styleUrls: ['./historico-dados-pessoais.component.css']
})
export class HistoricoDadosPessoaisComponent implements OnInit {
  historico: HistoricoDadosPessoais[] = [];
  loading = false;
  error: string | null = null;

  // Filtros
  filtroTipo: 'usuario' | 'entidade' = 'usuario';
  filtroIdUsuario: string = '';
  filtroEntidade: string = 'PACIENTE';
  filtroIdEntidade: string = '';

  constructor(private historicoService: HistoricoDadosPessoaisApiService) {}

  ngOnInit(): void {
    // Carrega automaticamente os 10 registros mais recentes ao entrar na tela
    this.carregarHistoricoRecentes();
  }

  carregarHistoricoRecentes(): void {
    this.loading = true;
    this.error = null;
    this.historico = [];

    this.historicoService.buscarHistoricoRecentes().subscribe({
      next: (data) => {
        this.historico = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao buscar histórico recente:', err);
        if (err.status === 403) {
          this.error = 'Acesso negado: apenas SUPER_ADMIN pode acessar o histórico';
        } else {
          this.error = 'Erro ao buscar histórico. Verifique o console para detalhes.';
        }
        this.loading = false;
      }
    });
  }

  buscarHistorico(): void {
    this.loading = true;
    this.error = null;
    this.historico = [];

    if (this.filtroTipo === 'usuario') {
      const idUsuario = parseInt(this.filtroIdUsuario);
      if (isNaN(idUsuario) || idUsuario <= 0) {
        this.error = 'ID do usuário inválido';
        this.loading = false;
        return;
      }

      this.historicoService.buscarHistoricoPorUsuario(idUsuario).subscribe({
        next: (data) => {
          this.historico = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erro ao buscar histórico por usuário:', err);
          if (err.status === 403) {
            this.error = 'Acesso negado: apenas SUPER_ADMIN pode acessar o histórico';
          } else {
            this.error = 'Erro ao buscar histórico. Verifique o console para detalhes.';
          }
          this.loading = false;
        }
      });
    } else {
      const idEntidade = parseInt(this.filtroIdEntidade);
      if (isNaN(idEntidade) || idEntidade <= 0) {
        this.error = 'ID da entidade inválido';
        this.loading = false;
        return;
      }

      this.historicoService.buscarHistoricoPorEntidade(this.filtroEntidade, idEntidade).subscribe({
        next: (data) => {
          this.historico = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erro ao buscar histórico por entidade:', err);
          if (err.status === 403) {
            this.error = 'Acesso negado: apenas SUPER_ADMIN pode acessar o histórico';
          } else {
            this.error = 'Erro ao buscar histórico. Verifique o console para detalhes.';
          }
          this.loading = false;
        }
      });
    }
  }

  limparFiltros(): void {
    this.filtroIdUsuario = '';
    this.filtroIdEntidade = '';
    this.carregarHistoricoRecentes();
  }

  formatarData(data: string): string {
    if (!data) return '-';
    const date = new Date(data);
    return date.toLocaleString('pt-BR');
  }

  getEntidadeLabel(entidade: string): string {
    const labels: { [key: string]: string } = {
      'PACIENTE': 'Paciente',
      'PROFISSIONAL': 'Profissional',
      'ADMIN': 'Administrador',
      'SECRETARIA': 'Secretária',
      'ORGANIZACAO': 'Organização',
      'ENDERECO': 'Endereço'
    };
    return labels[entidade] || entidade;
  }

  getCampoLabel(campo: string): string {
    // Converte camelCase para legível
    return campo.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }
}
