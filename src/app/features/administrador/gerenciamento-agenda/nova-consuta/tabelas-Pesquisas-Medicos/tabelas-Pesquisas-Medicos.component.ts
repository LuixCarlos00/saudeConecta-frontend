
import {
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Medico } from 'src/app/util/variados/interfaces/medico/medico';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Profissional } from 'src/app/util/variados/interfaces/medico/Profissional';

@Component({
  selector: 'app-tabelas-Pesquisas-Medicos',
  templateUrl: './tabelas-Pesquisas-Medicos.component.html',
  styleUrls: ['./tabelas-Pesquisas-Medicos.component.css'],
})
export class TabelasPesquisasMedicosComponent implements OnInit {

  dataSource: Profissional[] = [];
  highValue: number = 5;
  lowValue: number = 0;
  clickedRows = new Set<Medico>();

  constructor(
    public dialogRef: MatDialogRef<TabelasPesquisasMedicosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit(): void {
    this.dataSource = this.data;
    console.log('data source', this.dataSource);
  }

  /**
   * Retorna as especialidades formatadas como string separada por vírgula
   */
  getEspecialidades(profissional: any): string {
    if (!profissional.especialidades || profissional.especialidades.length === 0) {
      return 'Não informado';
    }

    // Se tiver apenas uma especialidade
    if (profissional.especialidades.length === 1) {
      return profissional.especialidades[0].nome;
    }

    // Se tiver múltiplas especialidades, junta com vírgula
    return profissional.especialidades
      .map((esp: any) => esp.nome)
      .join(', ');
  }

  /**
   * Retorna apenas a primeira especialidade (para o badge)
   */
  getPrimeiraEspecialidade(profissional: any): string {
    if (!profissional.especialidades || profissional.especialidades.length === 0) {
      return 'Não informado';
    }
    return profissional.especialidades[0].nome; // ✅ CORRIGIDO: especialidades no plural
  }

  /**
   * Verifica se tem múltiplas especialidades
   */
  temMultiplasEspecialidades(profissional: Profissional): boolean {
    if (!profissional.especialidades) {
      return false;
    }
    return profissional.especialidades.length > 1;
  }

  /**
   * Retorna o número de especialidades
   */
  getNumeroEspecialidades(profissional: any): number {
    return profissional.especialidades?.length || 0;
  }

  getPaginatorData(event: PageEvent): PageEvent {
    this.lowValue = event.pageIndex * event.pageSize;
    this.highValue = this.lowValue + event.pageSize;
    this.highValue = Math.min(this.highValue, this.dataSource.length);
    return event;
  }

  displayedColumns: string[] = ['position', 'Especialidade', 'MarcaConsulta'];

  marcarConsulta(elemento: Profissional): void {
    this.dialogRef.close(elemento);
  }
}
