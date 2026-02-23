import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-gerenciamento',
  templateUrl: './gerenciamento.component.html',
  styleUrls: ['./gerenciamento.component.css']
})
export class GerenciamentoComponent implements OnInit {
  
  // Data atual para exibição
  today = new Date();
  
  // Tab ativa (agenda ou novo)
  activeTab: 'agenda' | 'novo' = 'agenda';

  constructor() { }

  ngOnInit(): void { }

  /**
   * Define a tab ativa
   */
  setActiveTab(tab: 'agenda' | 'novo'): void {
    this.activeTab = tab;
  }
}
