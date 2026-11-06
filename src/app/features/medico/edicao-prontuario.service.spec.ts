import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { AuthService } from 'src/app/core/services/auth.service';

import { EdicaoProntuarioService } from './edicao-prontuario.service';
import { EditarProntuarioDentistaComponent } from './prontuario-dentista/editar-prontuario-dentista/editar-prontuario-dentista.component';
import { EditarProntuarioMedicoComponent } from './prontuario-medico/editar-prontuario-medico/editar-prontuario-medico.component';

describe('EdicaoProntuarioService', () => {
  let dialog: jasmine.SpyObj<MatDialog>;
  let servico: EdicaoProntuarioService;
  let usuarioLogado: { id: number } | null;
  const consulta = { id: 822, pacienteId: 3, profissionalId: 9, pacienteNome: 'Ana' };

  function dialogQueFechaCom(resultado: unknown): void {
    dialog.open.and.returnValue({ afterClosed: () => of(resultado) } as any);
  }

  beforeEach(() => {
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    usuarioLogado = { id: 8 };
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: AuthService, useValue: { getCurrentUser: () => usuarioLogado } },
      ],
    });
    servico = TestBed.inject(EdicaoProntuarioService);
  });

  it('MEDICO abre a tela do médico com a consulta nos dados do dialog', () => {
    dialogQueFechaCom(true);
    servico.editar('MEDICO', consulta).subscribe();
    expect(dialog.open).toHaveBeenCalledWith(EditarProntuarioMedicoComponent, jasmine.objectContaining({ data: { consulta } }));
  });

  it('DENTISTA abre a tela do dentista', () => {
    dialogQueFechaCom(true);
    servico.editar('DENTISTA', consulta).subscribe();
    expect(dialog.open).toHaveBeenCalledWith(EditarProntuarioDentistaComponent, jasmine.objectContaining({ data: { consulta } }));
  });

  it('emite true só quando o dialog fecha salvando; cancelar ou fechar emite false', () => {
    const resultados: boolean[] = [];
    for (const fechamento of [true, false, undefined]) {
      dialogQueFechaCom(fechamento);
      servico.editar('MEDICO', consulta).subscribe(r => resultados.push(r));
    }
    expect(resultados).toEqual([true, false, false]);
  });

  describe('ehDonoDoProntuario', () => {
    it('true só quando o id do item é o do usuário logado', () => {
      expect(servico.ehDonoDoProntuario(8)).toBeTrue();
      expect(servico.ehDonoDoProntuario(9)).toBeFalse();
    });

    it('id em string (item ou token) é comparado como número', () => {
      expect(servico.ehDonoDoProntuario('8' as any)).toBeTrue();
      usuarioLogado = { id: '8' as any };
      expect(servico.ehDonoDoProntuario(8)).toBeTrue();
      expect(servico.ehDonoDoProntuario('9' as any)).toBeFalse();
      expect(servico.ehDonoDoProntuario('abc' as any)).toBeFalse();
    });

    it('false quando o item não traz o id ou não há usuário logado', () => {
      expect(servico.ehDonoDoProntuario(undefined)).toBeFalse();
      expect(servico.ehDonoDoProntuario(null)).toBeFalse();
      usuarioLogado = null;
      expect(servico.ehDonoDoProntuario(8)).toBeFalse();
    });
  });
});
