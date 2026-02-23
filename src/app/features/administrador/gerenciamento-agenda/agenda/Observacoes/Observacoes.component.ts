import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-Observacoes',
  templateUrl: './Observacoes.component.html',
  styleUrls: ['./Observacoes.component.css']
})
export class ObservacoesComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<ObservacoesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { observacoes: string }
  ) {

  }

  onNoClick(): void {
    this.dialogRef.close();
  }
  ngOnInit() {
  }

}
