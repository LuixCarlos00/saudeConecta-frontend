import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { UsuariosModule } from './features/usuarios/usuarios.module';
import { AtendimentoModule } from './features/atendimento/atendimento.module';
import { ModalAssociarPlanoComponent } from './features/assinatura/components/modal-associar-plano/modal-associar-plano.component';
import { CadastroPacienteComponent } from './features/agenda/pages/cadastro-paciente/cadastro-paciente.component';
import { ObservacoesComponent } from './shared/ui/observacoes/observacoes.component';

/**
 * Dialogos que uma area lazy abre com componente declarado em OUTRA area:
 * usuarios abre ModalAssociarPlano (assinatura) e CadastroPaciente (agenda). O Observacoes (que o
 * atendimento abre) agora e do shared, e o teste segue garantindo que abre dentro do AtendimentoModule.
 * Cada area e carregada so com o proprio modulo, como no app real
 * (a area dona do componente nao e importada). Se o dialogo deixar de abrir/renderizar, o teste falha.
 */
describe('Dialogos que cruzam areas lazy', () => {
  let dialog: MatDialog;
  let http: HttpTestingController;

  const abrirComo = (modulo: unknown) => {
    TestBed.configureTestingModule({
      imports: [modulo as never, HttpClientTestingModule, RouterTestingModule, NoopAnimationsModule],
    });
    dialog = TestBed.inject(MatDialog);
    http = TestBed.inject(HttpTestingController);
  };

  afterEach(() => {
    dialog.closeAll();
  });

  it('usuarios abre o ModalAssociarPlanoComponent (assinatura) e ele renderiza com dados', () => {
    abrirComo(UsuariosModule);
    const ref = dialog.open(ModalAssociarPlanoComponent, {
      width: '700px',
      data: { organizacaoId: 7, nomeOrganizacao: 'Clinica Teste' },
      disableClose: true,
    });
    expect(ref.componentInstance).toBeInstanceOf(ModalAssociarPlanoComponent);
    ref.componentRef?.changeDetectorRef.detectChanges();
    const el = document.querySelector('app-modal-associar-plano') as HTMLElement;
    expect(el).not.toBeNull();
    expect(el.textContent).toContain('Clinica Teste');
    expect(http.match(() => true).length).toBeGreaterThan(0);
  });

  it('usuarios abre o CadastroPacienteComponent (agenda) e o formulario e criado', () => {
    abrirComo(UsuariosModule);
    const ref = dialog.open(CadastroPacienteComponent, {
      width: '90vw',
      maxWidth: '900px',
      maxHeight: '90vh',
      panelClass: 'cadastro-dialog-panel',
    });
    expect(ref.componentInstance).toBeInstanceOf(CadastroPacienteComponent);
    ref.componentRef?.changeDetectorRef.detectChanges();
    expect(ref.componentInstance.FormularioPaciente.contains('cpf')).toBeTrue();
    const el = document.querySelector('app-cadastro-paciente') as HTMLElement;
    expect(el).not.toBeNull();
    expect(el.querySelectorAll('input').length).toBeGreaterThan(0);
  });

  it('atendimento abre o ObservacoesComponent (shared) e mostra o texto', () => {
    abrirComo(AtendimentoModule);
    const ref: MatDialogRef<ObservacoesComponent> = dialog.open(ObservacoesComponent, {
      data: { observacoes: 'Paciente alergico a dipirona' },
    });
    ref.componentRef?.changeDetectorRef.detectChanges();
    const el = document.querySelector('app-Observacoes') as HTMLElement;
    expect(el).not.toBeNull();
    expect(el.textContent).toContain('Paciente alergico a dipirona');
  });
});
