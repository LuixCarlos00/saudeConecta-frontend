import { Pipe, PipeTransform } from '@angular/core';
import { HoraDia } from './agenda-calendario.component';

@Pipe({ name: 'totalConsultasDia' })
export class TotalConsultasDiaPipe implements PipeTransform {
  transform(horas: HoraDia[]): number {
    return horas.reduce((acc, h) => acc + h.consultas.length, 0);
  }
}
