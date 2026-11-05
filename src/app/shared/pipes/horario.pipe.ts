import { Pipe, PipeTransform } from '@angular/core';
import { formatarHoraLocal } from '../utils/data-local';

@Pipe({
  name: 'horario'
})
export class HorarioPipe implements PipeTransform {

  transform(dataHora: string): string {
    if (!dataHora) return '';
    
    return formatarHoraLocal(new Date(dataHora));
  }

}
