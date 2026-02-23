import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'horario'
})
export class HorarioPipe implements PipeTransform {

  transform(dataHora: string): string {
    if (!dataHora) return '';
    
    const data = new Date(dataHora);
    const horas = data.getHours().toString().padStart(2, '0');
    const minutos = data.getMinutes().toString().padStart(2, '0');
    
    return `${horas}:${minutos}`;
  }

}
