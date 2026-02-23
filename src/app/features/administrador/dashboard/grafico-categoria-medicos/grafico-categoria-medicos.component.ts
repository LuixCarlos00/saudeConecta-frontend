import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';
import { MedicoApiService } from 'src/app/services/api/medico-api.service';
import { tokenService } from 'src/app/util/Token/Token.service';

@Component({
  selector: 'app-grafico-categoria-medicos',
  templateUrl: './grafico-categoria-medicos.component.html',
  styleUrls: ['./grafico-categoria-medicos.component.css']
})
export class GraficoCategoriaMedicosComponent implements OnInit {

  QuantidadeDeCategorias: number = 0;
  CategoriasMedicos: string[] = [];
  TodosMedicos: any[] = [];
  totalMedicos: number = 0;
  chart: any | undefined;
  private organizacaoId: number | null = null;

  @ViewChild("menuCanvas", { static: true }) elemento: ElementRef | undefined;

  constructor(
    private medicoApiService: MedicoApiService,
    private tokenService: tokenService
  ) { }

  ngOnInit() {
    // Obtém organizacaoId do usuário logado
    this.tokenService.decodificaToken();
    const usuario = this.tokenService.getUsuarioLogado();
    if (usuario) {
      this.organizacaoId = usuario.organizacaoId || null;
    }

    // Define a requisição baseada no tipo de usuário
    const request$ = this.organizacaoId
      ? this.medicoApiService.buscarPorOrganizacao(this.organizacaoId)
      : this.medicoApiService.buscarTodos();

    request$.subscribe((dados) => {
      this.TodosMedicos = dados;
      this.totalMedicos = this.TodosMedicos.length;
      this.apurandoDados();
      this.criarGrafico();
    });
  }

  apurandoDados() {
    this.TodosMedicos.forEach((medico) => {
      const especialidade = this.getEspecialidadePrincipal(medico);
      if (especialidade && !this.CategoriasMedicos.includes(especialidade)) {
        this.CategoriasMedicos.push(especialidade);
      }
    });
  }

  private getEspecialidadePrincipal(medico: any): string {
    if (medico.especialidades && medico.especialidades.length > 0) {
      return medico.especialidades[0].nome;
    }
    if (medico.medEspecialidade) {
      return medico.medEspecialidade.toString();
    }
    return 'Não informado';
  }

  criarGrafico() {
    if (this.elemento) {
      const labels = this.CategoriasMedicos.map(categoria => {
        const quantidade = this.TodosMedicos.filter(medico => this.getEspecialidadePrincipal(medico) === categoria).length;
        return `${categoria} (${quantidade})`;
      });

      const data = this.CategoriasMedicos.map(categoria => {
        return this.TodosMedicos.filter(medico => this.getEspecialidadePrincipal(medico) === categoria).length;
      });

      this.chart = new Chart(this.elemento.nativeElement, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            label: 'Médicos por Categoria',
            data: data,
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              callbacks: {
                label: function(tooltipItem: any) {
                  return tooltipItem.label + ': ' + tooltipItem.raw.toFixed(0);
                }
              }
            }
          }
        }
      });
    }
  }
}
