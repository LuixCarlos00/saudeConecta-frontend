import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { UsuarioApiService } from 'src/app/services/api/usuario-api.service';
import { PacienteApiService } from 'src/app/services/api/paciente-api.service';
import { AdministradorApiService } from 'src/app/services/api/administrador-api.service';
import { SecretariaApiService } from 'src/app/services/api/secretaria-api.service';
import { FiltroStateService } from 'src/app/services/state/filtro-state.service';
import { DialogService } from 'src/app/util/variados/dialogo-confirmação/dialog.service';
import { TrocaSenhaUsuariosComponent } from './TrocaSenhaUsuarios/TrocaSenhaUsuarios.component';
import { VisualizarEditarUsuarioComponent } from './VisualizarEditarUsuario/visualizar-editar-usuario.component';

import { Adiministrador } from 'src/app/util/variados/interfaces/administrado/adiministrador';
import { Secretaria } from 'src/app/util/variados/interfaces/secretaria/secretaria';
import { Paciente } from 'src/app/util/variados/interfaces/paciente/paciente';
import { ProfissionalApiService } from 'src/app/services/api/profissional-api.service';
import { is } from 'date-fns/locale';
import { Profissional } from 'src/app/util/variados/interfaces/medico/Profissional';

export enum CategoriaUsuario {
  PACIENTE = 1,
  CLINICO = 2,
  SECRETARIA = 3,
  ADMINISTRADOR = 4,
  TODOS = 5
}

export interface UsuarioUnificado {
  codigo: number;
  nome: string;
  email: string;
  categoria: string;
  categoriaIcon: string;
  status: boolean;
  dadosOriginais: any;
}

@Component({
  selector: 'app-tabela-todos-usuarios',
  templateUrl: './tabela-todos-usuarios.component.html',
  styleUrls: ['./tabela-todos-usuarios.component.css'],
})
export class TabelaTodosUsuariosComponent implements OnInit, OnDestroy {
  @Output() LimparCampos = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  dataSource: UsuarioUnificado[] = [];
  todosUsuarios: UsuarioUnificado[] = [];
  isLoading = false;

  private categoriaAtual: CategoriaUsuario = CategoriaUsuario.TODOS;
  private searchText = '';

  private pacientes: Paciente[] = [];
  private clinico: Profissional[] = [];
  private secretarias: Secretaria[] = [];
  private administradores: Adiministrador[] = [];

  displayedColumns = ['index', 'nome', 'categoria', 'email', 'status', 'acoes'];

  constructor(
    private usuarioApiService: UsuarioApiService,
    private pacienteApiService: PacienteApiService,
    private administradorApiService: AdministradorApiService,
    private secretariaApiService: SecretariaApiService,
    private filtroStateService: FiltroStateService,
    private dialogService: DialogService,
    private dialog: MatDialog,
    private clinicoApiService: ProfissionalApiService
  ) { }

  ngOnInit(): void {
    this.inicializarSubscriptions();
    this.carregarUsuarios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private inicializarSubscriptions(): void {
    this.filtroStateService.categoria$
      .pipe(takeUntil(this.destroy$))
      .subscribe((radioValue: any) => {
        if (radioValue) {
          this.categoriaAtual = radioValue as CategoriaUsuario;
          this.aplicarFiltros();
        }
      });

    this.filtroStateService.searchText$
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchText: any) => {
        this.searchText = searchText;
        this.aplicarFiltros();
      });

    this.filtroStateService.recarregar$
      .pipe(takeUntil(this.destroy$))
      .subscribe((recarregar: boolean) => {
        if (recarregar) {
          this.carregarUsuarios();
        }
      });
  }

  carregarUsuarios(): void {
    this.isLoading = true;
    this.usuarioApiService.buscarTodosAgrupados()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.pacientes = data.paciente || [];
          this.clinico = data.clinico || [];
          this.secretarias = data.secretaria || [];
          this.administradores = data.administrador || [];
          this.todosUsuarios = this.unificarUsuarios();
          this.aplicarFiltros();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar usuários:', error);
          this.isLoading = false;
          this.mostrarErro('Erro ao carregar usuários. Tente novamente.');
        }
      });
  }

  private unificarUsuarios(): UsuarioUnificado[] {
    const usuarios: UsuarioUnificado[] = [];

    this.pacientes.forEach(p => usuarios.push({
      codigo: (p as any).id ?? 0,
      nome: (p as any).nome ?? '',
      email: (p as any).email ?? '',
      categoria: 'Paciente',
      categoriaIcon: 'fa-user-injured',
      status: (p as any).status === 'ATIVO',
      dadosOriginais: p
    }));

    this.clinico.forEach(m => usuarios.push({
      codigo: (m as any).id ?? 0,
      nome: (m as any).nome ?? '',
      email: (m as any).email ?? '',
      categoria: 'Clinico',
      categoriaIcon: 'fa-user-doctor',
      status: (m as any).status === 'ATIVO',
      dadosOriginais: m
    }));

    this.secretarias.forEach(s => usuarios.push({
      codigo: (s as any).id ?? 0,
      nome: (s as any).nome ?? '',
      email: (s as any).email ?? '',
      categoria: 'Secretária',
      categoriaIcon: 'fa-user-tie',
      status: (s as any).status === 'ATIVO',
      dadosOriginais: s
    }));

    this.administradores.forEach(a => usuarios.push({
      codigo: (a as any).id ?? 0,
      nome: (a as any).nome ?? '',
      email: (a as any).email ?? '',
      categoria: 'Administrador',
      categoriaIcon: 'fa-user-shield',
      status: (a as any).status === 'ATIVO',
      dadosOriginais: a
    }));

    return usuarios;
  }

  private aplicarFiltros(): void {
    let resultado = [...this.todosUsuarios];

    // Filtro por categoria
    resultado = this.filtrarPorCategoria(resultado);

    // Filtro por texto de pesquisa
    resultado = this.filtrarPorTexto(resultado);

    this.dataSource = resultado;

    if (this.searchText && resultado.length === 0) {
      this.dialogService.NaoFoiEncontradoConsultasComEssesParametros();
    }
  }

  private filtrarPorCategoria(usuarios: UsuarioUnificado[]): UsuarioUnificado[] {
    const categoriaMap: Record<CategoriaUsuario, string | null> = {
      [CategoriaUsuario.PACIENTE]: 'Paciente',
      [CategoriaUsuario.CLINICO]: 'Clinico',
      [CategoriaUsuario.SECRETARIA]: 'Secretária',
      [CategoriaUsuario.ADMINISTRADOR]: 'Administrador',
      [CategoriaUsuario.TODOS]: null
    };

    const categoriaFiltro = categoriaMap[this.categoriaAtual];
    if (!categoriaFiltro) return usuarios;

    return usuarios.filter(u => u.categoria === categoriaFiltro);
  }

  private filtrarPorTexto(usuarios: UsuarioUnificado[]): UsuarioUnificado[] {
    if (!this.searchText?.trim()) return usuarios;

    const termoBusca = this.normalizeString(this.searchText);
    return usuarios.filter(u =>
      this.normalizeString(u.nome).includes(termoBusca) ||
      this.normalizeString(u.email).includes(termoBusca)
    );
  }

  private normalizeString(str: string): string {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
  }

  confirmarDelecao(usuario: UsuarioUnificado): void {
    Swal.fire({
      title: 'Confirmar exclusão',
      text: `Deseja realmente excluir ${usuario.nome}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deletar(usuario);
      }
    });
  }

  private deletar(usuario: UsuarioUnificado): void {
    const element = usuario.dadosOriginais;
    let request$;
    // Escolhe o endpoint correto dependendo do tipo de usuário
    if (usuario.categoria === 'Paciente') {
      const codigo = element.id;
      if (!codigo) return;
      request$ = this.pacienteApiService.deletarPacienteByOrg(codigo);
    } else if (usuario.categoria === 'Clinico') {
      const codigo = element.id;
      if (!codigo) return;
      request$ = this.clinicoApiService.deletarClinicoIdByOrg(codigo);
    } else if (usuario.categoria === 'Administrador') {
      const codigo = element.id;
      if (!codigo) return;
      request$ = this.administradorApiService.deletarAdmByOrg(codigo);
    } else if (usuario.categoria === 'Secretária') {
      const codigo = element.id;
      if (!codigo) return;
      request$ = this.secretariaApiService.deletarSecretariaIdByOrg(codigo);
    } else {
      return;
    }

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.mostrarSucesso('Usuário deletado com sucesso!');
        this.carregarUsuarios();
        this.LimparCampos.emit();
      },
      error: (error) => this.handleHttpError(error)
    });
  }

  private obterCodigoUsuario(element: any): number | null {
    // Para médico, secretária e administrador: usar usuarioId do DTO
    if (element.id) return element.id;
    // Para paciente: usar paciCodigo
    if (element.codigo) return element.codigo;


    return null;
  }

  private handleHttpError(error: any): void {
    console.error('Erro na operação:', error);

    let errorMessage = 'Erro desconhecido. Tente novamente.';

    // Verifica se é erro de violação de FK (status 500 com constraint)
    if (error.status === 500) {
      errorMessage = 'Não é possível excluir este usuário pois existem registros relacionados a ele (consultas, prontuários, etc). Remova os registros relacionados primeiro ou desative o usuário.';
    } else if (error.error?.includes?.('Cannot delete') || error.error?.includes?.('foreign key') || error.error?.includes?.('constraint')) {
      errorMessage = 'Não é possível excluir este usuário pois existem registros relacionados a ele (consultas, prontuários, etc). Remova os registros relacionados primeiro ou desative o usuário.';
    } else if (typeof error.error === 'string' && error.error.length > 0) {
      errorMessage = error.error;
    }

    this.mostrarErro(errorMessage);
  }

  private mostrarSucesso(mensagem: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Sucesso!',
      text: mensagem,
      timer: 2000,
      showConfirmButton: false
    });
  }

  private mostrarErro(mensagem: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: mensagem,
      showCloseButton: true
    });
  }

  alternarStatusUsuario(usuario: UsuarioUnificado): void {
    const novoStatus = usuario.status ? 0 : 1;
    const acao = novoStatus === 0 ? 'bloquear' : 'desbloquear';

    Swal.fire({
      title: `Confirmar ${acao}`,
      text: `Deseja ${acao} o usuário ${usuario.nome}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: novoStatus === 0 ? '#d33' : '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: novoStatus === 0 ? 'Bloquear' : 'Desbloquear',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.executarAlteracaoStatus(usuario, novoStatus);
      }
    });
  }

  private executarAlteracaoStatus(usuario: UsuarioUnificado, status: number): void {
    const element = usuario.dadosOriginais;

    // Determina se é paciente baseado na categoria do usuário unificado
    const isPaciente = usuario.categoria === 'Paciente';

    const usuarioId = this.obterCodigoUsuario(element);

    if (!isPaciente && !usuarioId) {
      this.mostrarErro('ID do usuário não encontrado. Recarregue a página e tente novamente.');
      return;
    }

    const bloquearUsuarioRequest = {
      status: status || 0,
      codigoUsuario: element.usuarioId || 0,
      codigo: element.id || 0,
    };

    const request$ = isPaciente
      ? this.pacienteApiService.bloquearPacientebyOrg(bloquearUsuarioRequest)
      : this.usuarioApiService.bloquearUsuariobyOrg(bloquearUsuarioRequest);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.mostrarSucesso(`Usuário ${status === 0 ? 'bloqueado' : 'desbloqueado'} com sucesso!`);
        this.carregarUsuarios();
        this.LimparCampos.emit();
      },
      error: (error) => {
        console.error('Erro ao alterar status:', error);
        this.mostrarErro('Erro ao alterar status do usuário.');
      }
    });
  }

  abrirTrocaSenha(usuario: UsuarioUnificado): void {

    if (usuario.categoria === 'Paciente') return;

    this.dialog.open(TrocaSenhaUsuariosComponent, {
      width: 'auto',
      data: { elements: usuario.dadosOriginais }
    });
  }

  isPaciente(usuario: UsuarioUnificado): boolean {
    return usuario.categoria === 'Paciente';
  }

  abrirVisualizarEditar(usuario: UsuarioUnificado): void {
    const dialogRef = this.dialog.open(VisualizarEditarUsuarioComponent, {
      width: '650px',
      maxHeight: '90vh',
      data: { usuario },
      panelClass: 'dialog-visualizar-editar'
    });

    dialogRef.afterClosed().subscribe((atualizado: boolean) => {
      if (atualizado) {
        this.carregarUsuarios();
      }
    });
  }
}
