import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ConsultaApiService } from 'src/app/core/data-access/consulta-api.service';
import { IALocalService } from 'src/app/services/ia-local.service';
import { EdicaoProntuarioService } from '../../edicao-prontuario.service';
import { AbaHistoricoComponent } from './aba-historico.component';

describe('AbaHistoricoComponent - edição de registro', () => {
  let consultaApi: jasmine.SpyObj<ConsultaApiService>;
  let edicao: jasmine.SpyObj<EdicaoProntuarioService>;
  let aba: AbaHistoricoComponent;
  const registro: any = { consultaId: 677, pacienteId: 3, profissionalId: 9, pacienteNome: 'Ana', tipoProntuario: 'DENTISTA' };

  beforeEach(() => {
    consultaApi = jasmine.createSpyObj('ConsultaApiService', ['BuscandoHistoricoDeConsultasDoPaciente']);
    consultaApi.BuscandoHistoricoDeConsultasDoPaciente.and.returnValue(of([registro]));
    edicao = jasmine.createSpyObj('EdicaoProntuarioService', ['editar']);
    TestBed.configureTestingModule({
      providers: [
        AbaHistoricoComponent,
        { provide: ConsultaApiService, useValue: consultaApi },
        { provide: IALocalService, useValue: {} },
        { provide: EdicaoProntuarioService, useValue: edicao },
      ],
    });
    aba = TestBed.inject(AbaHistoricoComponent);
    aba.pacienteId = 3;
    aba.ngOnInit();
  });

  it('abre a edição do tipo DENTISTA com os dados da consulta do registro', () => {
    edicao.editar.and.returnValue(of(false));
    aba.editarRegistro(registro);
    expect(edicao.editar).toHaveBeenCalledOnceWith('DENTISTA', { id: 677, pacienteId: 3, profissionalId: 9, pacienteNome: 'Ana' });
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
});
