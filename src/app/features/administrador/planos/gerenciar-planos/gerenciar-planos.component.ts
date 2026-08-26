import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlanoApiService } from 'src/app/services/api/plano-api.service';
import { PlanoAssinatura, PlanoAssinaturaRequest } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';
import { PlanoDescricaoParserService } from 'src/app/services/plano-descricao-parser.service';
import { ModalValoresAdicionaisComponent } from './modal-valores-adicionais/modal-valores-adicionais.component';

@Component({
  selector: 'app-gerenciar-planos',
  templateUrl: './gerenciar-planos.component.html',
  styleUrls: ['./gerenciar-planos.component.css']
})
export class GerenciarPlanosComponent implements OnInit {

  planos: PlanoAssinatura[] = [];
  isLoading = true;
  mostrarFormulario = false;
  modoEdicao = false;
  planoForm: FormGroup;
  planoEditandoId: number | null = null;

  tiposPlano = [
    { value: 'STARTER', label: 'Starter' },
    { value: 'PROFISSIONAL', label: 'Profissional' },
    { value: 'BUSINESS', label: 'Business' }
  ];

  constructor(
    private planoApiService: PlanoApiService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private parser: PlanoDescricaoParserService
  ) {
    this.planoForm = this.fb.group({
      nome: ['', Validators.required],
      titulo: ['', Validators.required],
      recursos: [''],
      tipo: ['', Validators.required],
      valorMensal: [0, [Validators.required, Validators.min(0)]],
      limiteAdminOrg: [null],
      limiteProfissional: [null],
      limiteSecretaria: [null],
      valorAdicionalAdmin: [null],
      valorAdicionalProfissional: [null],
      valorAdicionalSecretaria: [null]
    });
  }

  ngOnInit(): void {
    this.carregarPlanos();
  }

  carregarPlanos(): void {
    this.isLoading = true;
    this.planoApiService.listarPlanosAtivos().subscribe({
      next: (planos) => {
        this.planos = planos;
        this.isLoading = false;
      },
      error: (err) => {
        this.snackBar.open('Erro ao carregar planos', 'Fechar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  abrirFormularioEdicao(plano: PlanoAssinatura): void {
    this.modoEdicao = true;
    this.planoEditandoId = plano.id;
    
    // Tenta usar titulo separado se disponível e limpo
    let titulo = plano.titulo;
    let recursosArray = plano.recursos || [];
    
    // Se não tiver titulo separado ou tiver formato antigo com "Recursos:", faz parse
    if (!titulo || titulo.includes('Recursos:') || titulo.includes('[')) {
      // Tenta extrair manualmente usando regex
      if (plano.descricao) {
        const tituloMatch = plano.descricao.match(/titulo:\s*(.+?)(?:\s*(?:Recursos:|$))/i);
        if (tituloMatch && tituloMatch[1]) {
          titulo = tituloMatch[1].trim();
        }
        
        // Extrair recursos manualmente
        const recursosMatch = plano.descricao.match(/Recursos:\s*(\[.*?\])/i);
        if (recursosMatch && recursosMatch[1]) {
          try {
            recursosArray = JSON.parse(recursosMatch[1]);
          } catch (e) {
            recursosArray = [];
          }
        }
      }
      
      // Se ainda não tiver, usa o parser como fallback
      if (!titulo) {
        const parsed = this.parser.parse(plano.descricao);
        titulo = parsed.titulo || '';
        if (recursosArray.length === 0) {
          recursosArray = parsed.recursos || [];
        }
      }
    }
    
    // Converter array de recursos para formato de quebra de linha (um por linha)
    const recursosString = recursosArray.length > 0 ? recursosArray.join('\n') : '';
    
    this.planoForm.patchValue({
      nome: plano.nome,
      titulo: titulo,
      recursos: recursosString,
      tipo: plano.tipo,
      valorMensal: plano.valorMensal,
      limiteAdminOrg: plano.limiteAdminOrg,
      limiteProfissional: plano.limiteProfissional,
      limiteSecretaria: plano.limiteSecretaria,
      valorAdicionalAdmin: plano.valorAdicionalAdmin,
      valorAdicionalProfissional: plano.valorAdicionalProfissional,
      valorAdicionalSecretaria: plano.valorAdicionalSecretaria
    });
    this.mostrarFormulario = true;
  }

  fecharFormulario(): void {
    this.mostrarFormulario = false;
    this.planoForm.reset();
    this.planoEditandoId = null;
  }

  salvarPlano(): void {
    if (this.planoForm.invalid) {
      this.snackBar.open('Preencha todos os campos obrigatórios', 'Fechar', { duration: 3000 });
      return;
    }

    if (!this.planoEditandoId) {
      this.snackBar.open('Erro: ID do plano não encontrado', 'Fechar', { duration: 3000 });
      return;
    }

    // Converter string de recursos separada por quebra de linha para array
    const recursosArray = this.planoForm.value.recursos 
      ? this.planoForm.value.recursos.split('\n').map((r: string) => r.trim()).filter((r: string) => r.length > 0)
      : [];

    // Formatar a descrição usando titulo e recursos
    const descricaoFormatada = this.parser.format(
      this.planoForm.value.titulo,
      recursosArray
    );

    const request: PlanoAssinaturaRequest = {
      nome: this.planoForm.value.nome,
      descricao: descricaoFormatada,
      titulo: this.planoForm.value.titulo,
      recursos: recursosArray,
      tipo: this.planoForm.value.tipo,
      valorMensal: this.planoForm.value.valorMensal,
      limiteAdminOrg: this.planoForm.value.limiteAdminOrg || null,
      limiteProfissional: this.planoForm.value.limiteProfissional || null,
      limiteSecretaria: this.planoForm.value.limiteSecretaria || null,
      valorAdicionalAdmin: this.planoForm.value.valorAdicionalAdmin || null,
      valorAdicionalProfissional: this.planoForm.value.valorAdicionalProfissional || null,
      valorAdicionalSecretaria: this.planoForm.value.valorAdicionalSecretaria || null
    };

    this.atualizarPlano(request);
  }

  private atualizarPlano(request: PlanoAssinaturaRequest): void {
    if (!this.planoEditandoId) return;

    this.planoApiService.atualizarPlano(this.planoEditandoId, request).subscribe({
      next: (plano) => {
        this.snackBar.open('Plano atualizado com sucesso!', 'Fechar', { duration: 3000 });
        this.fecharFormulario();
        this.carregarPlanos();
      },
      error: (err) => {
        const msg = err.error?.message || 'Erro ao atualizar plano';
        this.snackBar.open(msg, 'Fechar', { duration: 5000 });
      }
    });
  }

  desativarPlano(plano: PlanoAssinatura): void {
    if (!confirm(`Deseja realmente desativar o plano "${plano.nome}"?`)) {
      return;
    }

    this.planoApiService.desativarPlano(plano.id).subscribe({
      next: () => {
        this.snackBar.open('Plano desativado com sucesso!', 'Fechar', { duration: 3000 });
        this.carregarPlanos();
      },
      error: (err) => {
        const msg = err.error?.message || 'Erro ao desativar plano';
        this.snackBar.open(msg, 'Fechar', { duration: 5000 });
      }
    });
  }

  formatarValor(valor: number): string {
    return valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
  }

  formatarLimite(limite: number | null): string {
    return limite === null ? 'Ilimitado' : `${limite}`;
  }

  isLimiteIlimitado(campo: string): boolean {
    const valor = this.planoForm.get(campo)?.value;
    return valor === null || valor === '' || valor === 0;
  }

  toggleLimiteIlimitado(campo: string): void {
    const control = this.planoForm.get(campo);
    if (control) {
      control.setValue(this.isLimiteIlimitado(campo) ? 1 : null);
    }
  }

  getRecursosResumo(recursos: string[] | undefined): string {
    if (!recursos || recursos.length === 0) {
      return 'Nenhum recurso';
    }
    if (recursos.length <= 2) {
      return recursos.join(', ');
    }
    return `${recursos.slice(0, 2).join(', ')} e mais ${recursos.length - 2}`;
  }

  getRecursosFromPlano(plano: PlanoAssinatura): string[] {
    if (plano.recursos && plano.recursos.length > 0) {
      return plano.recursos;
    }
    // Fallback: parse da descrição se recursos não estiverem disponíveis
    const parsed = this.parser.parse(plano.descricao);
    return parsed.recursos || [];
  }

  getPlanoDescricao(plano: PlanoAssinatura): string {
    // Se já tiver titulo separado, usa ele. Caso contrário, faz parse da descricao
    if (plano.titulo && !plano.titulo.includes('Recursos:')) {
      return plano.titulo;
    }
    // Fallback: parse da descricao se titulo estiver com formato antigo
    const parsed = this.parser.parse(plano.descricao);
    return parsed.titulo || plano.descricao;
  }

  getRecursosPreview(): string[] {
    const recursosString = this.planoForm.value.recursos;
    if (!recursosString) return [];
    
    // Parse por quebra de linha (um recurso por linha)
    return recursosString
      .split('\n')
      .map((r: string) => r.trim())
      .filter((r: string) => r.length > 0);
  }

  onTituloChange(): void {
    // Método para quando o título for alterado (pode ser usado para validações ou updates)
  }

  onRecursosChange(): void {
    // Método para quando os recursos forem alterados (pode ser usado para validações ou updates)
  }

  isPlanoDestaqueTipo(tipo: string): boolean {
    return tipo === 'PROFISSIONAL';
  }

  isPlanoDestaque(plano: PlanoAssinatura): boolean {
    return this.isPlanoDestaqueTipo(plano.tipo);
  }

  abrirModalValores(): void {
    const dialogRef = this.dialog.open(ModalValoresAdicionaisComponent, {
      width: '90%',
      maxWidth: '1200px',
      maxHeight: '90vh',
      data: { planos: this.planos }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.carregarPlanos();
      }
    });
  }
}
