import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-aba-exame-objetivo-medico',
   templateUrl: './aba-exame-objetivo-medico.component.html',
  styleUrl: '../prontuario-shared.scss',
  host: { style: 'display: block; width: 100%;' },
})
export class AbaExameObjetivoMedicoComponent {

  // ── Sinais Vitais ──
  pressao = '';
  frequenciaRespiratoria = '';
  frequenciaArterialSistolica = '';
  frequenciaArterialDiastolica = '';
  pulso = '';
  altura = '';
  temperatura = '';
  peso = '';
  saturacao = '';
  hemoglobina = '';


  // ── Anamnese ──
  queixaPrincipal = '';
  anamnese = '';
  observacao = '';

  // ── Exame Físico ──
  exameOutros = '';

  // ── Diagnóstico e Tratamento ──
  diagnostico = '';
  orientacoes = '';

  exameSubTab = 0;

  setDados(dados: any): void {
    if (!dados) return;
    this.pressao = dados.pressao || '';
    this.frequenciaRespiratoria = dados.frequenciaRespiratoria || '';
    this.frequenciaArterialSistolica = dados.frequenciaArterialSistolica || '';
    this.frequenciaArterialDiastolica = dados.frequenciaArterialDiastolica || '';
    this.pulso = dados.pulso || '';
    this.altura = dados.altura || '';
    this.temperatura = dados.temperatura || '';
    this.peso = dados.peso || '';
    this.saturacao = dados.saturacao || '';
    this.hemoglobina = dados.hemoglobina || '';
    this.queixaPrincipal = dados.queixaPrincipal || '';
    this.anamnese = dados.anamnese || '';
    this.observacao = dados.observacao || '';
    this.exameOutros = dados.exameOutros || '';
    this.diagnostico = dados.diagnostico || '';
    this.orientacoes = dados.orientacoes || '';
  }

  getDados(): any {
    return {
      pressao: this.pressao,
      frequenciaRespiratoria: this.frequenciaRespiratoria,
      frequenciaArterialSistolica: this.frequenciaArterialSistolica,
      frequenciaArterialDiastolica: this.frequenciaArterialDiastolica,
      pulso: this.pulso,
      altura: this.altura,
      temperatura: this.temperatura,
      peso: this.peso,
      saturacao: this.saturacao,
      hemoglobina: this.hemoglobina,
      queixaPrincipal: this.queixaPrincipal,
      anamnese: this.anamnese,
      observacao: this.observacao,
      exameOutros: this.exameOutros,
      diagnostico: this.diagnostico,
      orientacoes: this.orientacoes,
    };
  }
}
