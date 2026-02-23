import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  pure: false
})
export class FilterPipe implements PipeTransform {
  /**
   * Filtra um array baseado em uma propriedade e valor
   * @param items Array a ser filtrado
   * @param property Nome da propriedade a ser verificada
   * @param value Valor esperado da propriedade
   * @returns Array filtrado
   */
  transform(items: any[], property: string, value: any): any[] {
    if (!items || !property) {
      return items;
    }

    return items.filter(item => item[property] === value);
  }
}
