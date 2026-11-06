import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { ProntuarioApiService } from 'src/app/core/data-access/prontuario-api.service';
import { ProntuarioDentistaApiService } from 'src/app/core/data-access/prontuario-dentista-api.service';
import { RelatorioService } from 'src/app/features/relatorio/relatorio.service';
import { AcoesConsultaService } from './acoes-consulta.service';

describe('AcoesConsultaService', () => {
  let service: AcoesConsultaService;
  let prontuarioApi: jasmine.SpyObj<ProntuarioApiService>;
  let prontuarioDentistaApi: jasmine.SpyObj<ProntuarioDentistaApiService>;
  const destroy$ = new Subject<void>();

  beforeEach(() => {
    prontuarioApi = jasmine.createSpyObj<ProntuarioApiService>('ProntuarioApiService', ['buscarMaisRecentePorConsulta']);
    prontuarioDentistaApi = jasmine.createSpyObj<ProntuarioDentistaApiService>(
      'ProntuarioDentistaApiService', ['buscarProntuarioDentistaById', 'buscarQuestionarioSaude']);
    TestBed.configureTestingModule({
      providers: [
        { provide: ProntuarioApiService, useValue: prontuarioApi },
        { provide: ProntuarioDentistaApiService, useValue: prontuarioDentistaApi },
        {
          provide: RelatorioService,
          useValue: {
            detectarTipoProfissional: (c: any) => c.tipoProfissionalNome?.toUpperCase() === 'DENTISTA' ? 'DENTISTA' : 'MEDICO'
          }
        },
      ],
    });
    service = TestBed.inject(AcoesConsultaService);
  });

  describe('buscarProntuarioMaisRecente', () => {
    it('dentista usa o prontuario do dentista', () => {
      prontuarioDentistaApi.buscarProntuarioDentistaById.and.returnValue(of({ codigo: 9 }));
      service.buscarProntuarioMaisRecente({ id: 1, tipoProfissionalNome: 'Dentista' } as any).subscribe();
      expect(prontuarioDentistaApi.buscarProntuarioDentistaById).toHaveBeenCalledWith(1);
      expect(prontuarioApi.buscarMaisRecentePorConsulta).not.toHaveBeenCalled();
    });

    it('medico usa o prontuario medico', () => {
      prontuarioApi.buscarMaisRecentePorConsulta.and.returnValue(of({ codigoProntuario: 3 }));
      service.buscarProntuarioMaisRecente({ id: 2, tipoProfissionalNome: 'Médico' } as any).subscribe();
      expect(prontuarioApi.buscarMaisRecentePorConsulta).toHaveBeenCalledWith(2);
    });
  });

  it('extrairCodigoProntuario aceita codigo (dentista), codigoProntuario (medico) ou nada', () => {
    expect(service.extrairCodigoProntuario({ codigo: 5 })).toBe(5);
    expect(service.extrairCodigoProntuario({ codigoProntuario: 7 })).toBe(7);
    expect(service.extrairCodigoProntuario(null)).toBeNull();
  });

  describe('verificarPlanejamentosAssinados', () => {
    it('marca so consultas REALIZADAS com todos os planejamentos assinados', () => {
      prontuarioApi.buscarMaisRecentePorConsulta.and.callFake((id: number) => of(
        id === 1
          ? { planejamentosTerapeuticos: [{ statusAssinatura: 'ASSINADO' }] }
          : { planejamentos: [{ statusAssinatura: 'ASSINADO' }, { statusAssinatura: 'PENDENTE' }] }
      ));
      const assinados = new Set<number>();
      const aoMarcar = jasmine.createSpy('aoMarcar');
      service.verificarPlanejamentosAssinados([
        { id: 1, status: 'REALIZADA' },
        { id: 2, status: 'REALIZADA' },
        { id: 3, status: 'CONFIRMADA' },
      ] as any, assinados, destroy$, aoMarcar);
      expect([...assinados]).toEqual([1]);
      expect(aoMarcar).toHaveBeenCalledTimes(1);
      expect(prontuarioApi.buscarMaisRecentePorConsulta).toHaveBeenCalledTimes(2);
    });

    it('nao consulta de novo um ID ja marcado', () => {
      const assinados = new Set<number>([1]);
      service.verificarPlanejamentosAssinados([{ id: 1, status: 'REALIZADA' }] as any, assinados, destroy$);
      expect(prontuarioApi.buscarMaisRecentePorConsulta).not.toHaveBeenCalled();
    });
  });

  it('verificarQuestionariosRespondidos marca so CONFIRMADAS com questionario respondido', () => {
    prontuarioDentistaApi.buscarQuestionarioSaude.and.callFake((id: number) => of({ respondido: id === 10 }));
    const respondidos = new Set<number>();
    service.verificarQuestionariosRespondidos([
      { id: 10, status: 'CONFIRMADA' },
      { id: 11, status: 'CONFIRMADA' },
      { id: 12, status: 'AGENDADA' },
    ] as any, respondidos, destroy$);
    expect([...respondidos]).toEqual([10]);
    expect(prontuarioDentistaApi.buscarQuestionarioSaude).toHaveBeenCalledTimes(2);
  });

  describe('WhatsApp', () => {
    it('formatarTelefoneWhatsApp deixa so digitos e poe 55 quando falta', () => {
      expect(service.formatarTelefoneWhatsApp('(48) 99999-0000')).toBe('5548999990000');
      expect(service.formatarTelefoneWhatsApp('+55 48 99999-0000')).toBe('5548999990000');
    });

    it('gerarLinkWhatsApp monta o wa.me com a mensagem codificada', () => {
      const consulta = {
        pacienteTelefone: '48999990000',
        pacienteNome: 'Ana',
        profissionalNome: 'Dr. Joao',
        dataHora: '2026-11-05T09:30:00',
      } as any;
      const link = service.gerarLinkWhatsApp(consulta);
      expect(link.startsWith('https://wa.me/5548999990000?text=')).toBeTrue();
      const texto = decodeURIComponent(link.split('?text=')[1]);
      expect(texto).toContain('Olá Ana');
      expect(texto).toContain('Dr. Joao');
      expect(texto).toContain('05/11/2026');
      expect(texto).toContain('09:30');
    });

    it('gerarLinkWhatsApp devolve vazio sem telefone ou sem consulta', () => {
      expect(service.gerarLinkWhatsApp({ pacienteTelefone: '' } as any)).toBe('');
      expect(service.gerarLinkWhatsApp(null)).toBe('');
    });
  });
});
