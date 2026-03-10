import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlanoApiService } from 'src/app/services/api/plano-api.service';
import { PlanoAssinatura, PlanoAssinaturaRequest } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';

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
    private dialog: MatDialog
  ) {
    this.planoForm = this.fb.group({
      nome: ['', Validators.required],
      descricao: ['', Validators.required],
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
          console.log(planos);
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
    this.planoForm.patchValue({
      nome: plano.nome,
      descricao: plano.descricao,
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

    const request: PlanoAssinaturaRequest = {
      nome: this.planoForm.value.nome,
      descricao: this.planoForm.value.descricao,
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
}
