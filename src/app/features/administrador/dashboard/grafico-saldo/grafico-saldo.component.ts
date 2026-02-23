import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-grafico-saldo',
  templateUrl: './grafico-saldo.component.html',
  styleUrls: ['./grafico-saldo.component.css']
})
export class GraficoSaldoComponent implements OnInit {

  @ViewChild("menuCanvas", { static: true }) elemento: ElementRef | undefined;

  constructor() { }

  ngOnInit() {
    if (this.elemento) {
      new Chart(this.elemento.nativeElement, {
        type: 'pie',
        data: {
          labels: ['Receitas', 'Despesas'],
          datasets: [{
            label: 'Distribuição de Saldo',
            data: [70, 30], // Valores percentuais ou absolutos
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)'
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
                  return tooltipItem.label + ': ' + tooltipItem.raw.toFixed(2);
                }
              }
            }
          }
        }
      });
    }
  }
}
