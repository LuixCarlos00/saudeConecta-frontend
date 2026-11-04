import { FormControl } from '@angular/forms';
import { dataNascimentoPacienteValidator, dataNascimentoValidator } from './form-validators';
import { formatarDataLocal } from '../../shared/utils/data-local';

describe('validators de data de nascimento (data local)', () => {
  afterEach(() => jasmine.clock().uninstall());

  it('paciente: hoje (string yyyy-MM-dd) às 23:30 é barrado como futuro', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 10, 4, 23, 30));
    const erro = dataNascimentoPacienteValidator()(new FormControl(formatarDataLocal(new Date())));
    expect(erro).toEqual({ dataFutura: true });
  });

  it('paciente: ontem é válido', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 10, 4, 12, 0));
    expect(dataNascimentoPacienteValidator()(new FormControl('2026-11-03'))).toBeNull();
  });

  it('paciente: texto inválido retorna dataInvalida', () => {
    expect(dataNascimentoPacienteValidator()(new FormControl('abc'))).toEqual({ dataInvalida: true });
  });

  it('paciente: aceita objeto Date', () => {
    expect(dataNascimentoPacienteValidator()(new FormControl(new Date(2000, 0, 1)))).toBeNull();
  });

  it('profissional: hoje é barrado como futuro', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 10, 4, 22, 0));
    expect(dataNascimentoValidator()(new FormControl('2026-11-04'))).toEqual({ dataFutura: true });
  });

  it('profissional: menor de 18 anos retorna idadeMinima', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 10, 4, 12, 0));
    const erro = dataNascimentoValidator()(new FormControl('2015-01-01'));
    expect(erro?.['idadeMinima']).toBeTruthy();
  });

  it('profissional: adulto válido', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 10, 4, 12, 0));
    expect(dataNascimentoValidator()(new FormControl('1990-05-10'))).toBeNull();
  });
});
