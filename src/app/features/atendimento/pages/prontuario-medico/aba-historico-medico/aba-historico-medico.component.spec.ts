import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ConsultaApiService } from 'src/app/core/data-access/consulta-api.service';
import { IALocalService } from 'src/app/features/atendimento/data-access/ia-local.service';
import { EdicaoProntuarioService } from 'src/app/features/atendimento/data-access/edicao-prontuario.service';
import { AbaHistoricoMedicoComponent } from './aba-historico-medico.component';

describe('AbaHistoricoMedicoComponent - edição de registro', () => {
  let consultaApi: jasmine.SpyObj<ConsultaApiService>;
  let edicao: jasmine.SpyObj<EdicaoProntuarioService>;
  let aba: AbaHistoricoMedicoComponent;
  const registro: any = { consultaId: 677, pacienteId: 3, profissionalId: 9, pacienteNome: 'Ana', tipoProntuario: 'MEDICO' };

  beforeEach(() => {
    consultaApi = jasmine.createSpyObj('ConsultaApiService', ['BuscandoHistoricoDeConsultasDoPaciente']);
    consultaApi.BuscandoHistoricoDeConsultasDoPaciente.and.returnValue(of([registro]));
    edicao = jasmine.createSpyObj('EdicaoProntuarioService', ['editar', 'ehDonoDoProntuario']);
    TestBed.configureTestingModule({
      providers: [
        AbaHistoricoMedicoComponent,
        { provide: ConsultaApiService, useValue: consultaApi },
        { provide: IALocalService, useValue: {} },
        { provide: EdicaoProntuarioService, useValue: edicao },
      ],
    });
    aba = TestBed.inject(AbaHistoricoMedicoComponent);
    aba.pacienteId = 3;
    aba.ngOnInit();
  });

  it('abre a edição do tipo MEDICO com os dados da consulta do registro', () => {
    edicao.editar.and.returnValue(of(false));
    aba.editarRegistro(registro);
    expect(edicao.editar).toHaveBeenCalledOnceWith('MEDICO', { id: 677, pacienteId: 3, profissionalId: 9, pacienteNome: 'Ana' });
  });

  it('depois de salvar, recarrega o histórico', () => {
    edicao.editar.and.returnValue(of(true));
    aba.editarRegistro(registro);
    expect(consultaApi.BuscandoHistoricoDeConsultasDoPaciente).toHaveBeenCalledTimes(2);
  });

  it('fechar sem salvar não recarrega o histórico', () => {
    edicao.editar.and.returnValue(of(false));
    aba.editarRegistro(registro);
    expect(consultaApi.BuscandoHistoricoDeConsultasDoPaciente).toHaveBeenCalledTimes(1);
  });

  it('ehDonoDoProntuario pergunta ao serviço com o usuário do profissional do registro', () => {
    edicao.ehDonoDoProntuario.and.returnValue(true);
    expect(aba.ehDonoDoProntuario({ ...registro, profissionalUsuarioId: 8 })).toBeTrue();
    expect(edicao.ehDonoDoProntuario).toHaveBeenCalledWith(8);
  });
});
