import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
import { ProntuarioStateService } from 'src/app/core/data-access/prontuario-state.service';

import { TabelaAgendaMedicoComponent } from './tabela-agenda-medico.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../testing/configuracao-teste';

describe('TabelaAgendaMedicoComponent', () => {
  let component: TabelaAgendaMedicoComponent;
  let fixture: ComponentFixture<TabelaAgendaMedicoComponent>;
  let http: HttpTestingController;
  const urlRascunhos = `${environment.apiUrl}/atendimentos/rascunhos/meus`;

  const consultas = [
    { id: 10, pacienteNome: 'Ana', dataHora: '2026-11-05T09:00:00' },
    { id: 11, pacienteNome: 'Beto', dataHora: '2026-11-05T10:00:00' },
  ] as any[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TabelaAgendaMedicoComponent],
      imports: [...IMPORTS_TESTE_PADRAO, MatTableModule],
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO,
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TabelaAgendaMedicoComponent);
    component = fixture.componentInstance;
  });

  function textosDosBotoes(): string[] {
    return Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.start-btn'))
      .map(b => b.textContent!.trim());
  }

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('busca os rascunhos uma unica vez e mostra "Retomar atendimento" so na consulta com rascunho', () => {
    fixture.detectChanges();
    const req = http.expectOne(urlRascunhos);
    req.flush([{ consultaId: 11, atualizadoEm: '2026-11-05T09:30:00', tempoAcumuladoSegundos: 120 }]);
    http.match(() => true); // demais chamadas (agenda) não interessam aqui
    component.dataSource = consultas;
    fixture.detectChanges();

    expect(component.temRascunho(consultas[0])).toBeFalse();
    expect(component.temRascunho(consultas[1])).toBeTrue();
    expect(textosDosBotoes()).toEqual(['Iniciar', 'Retomar atendimento']);
    const icones = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.start-btn i'))
      .map(i => i.className);
    expect(icones[0]).toContain('fa-stethoscope');
    expect(icones[1]).toContain('fa-rotate-right');
    http.expectNone(urlRascunhos); // nenhuma chamada por consulta
  });

  it('se a lista de rascunhos falhar, a agenda segue com "Iniciar" em todas', () => {
    fixture.detectChanges();
    http.expectOne(urlRascunhos).flush('erro', { status: 500, statusText: 'Server Error' });
    http.match(() => true);
    component.dataSource = consultas;
    fixture.detectChanges();
    expect(textosDosBotoes()).toEqual(['Iniciar', 'Iniciar']);
  });

  it('Retomar leva ao mesmo destino de Iniciar: rota com o id da consulta', () => {
    fixture.detectChanges();
    http.match(() => true);
    const router = TestBed.inject(Router);
    const navegar = spyOn(router, 'navigate').and.resolveTo(true);
    const setConsulta = spyOn(TestBed.inject(ProntuarioStateService), 'setConsulta');
    spyOn(Swal, 'fire');
    component.UsuarioLogado.tipoProfissional = 'MEDICO';
    component.AbrirConsulta(consultas[1]);
    expect(setConsulta).toHaveBeenCalledWith(consultas[1]);
    expect(navegar).toHaveBeenCalledWith(['startconsulta', 11]);

    component.UsuarioLogado.tipoProfissional = 'DENTISTA';
    component.AbrirConsulta(consultas[0]);
    expect(navegar).toHaveBeenCalledWith(['startconsulta-dentista', 10]);
  });
});
