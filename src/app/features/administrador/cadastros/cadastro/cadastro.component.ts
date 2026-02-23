import { Router } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.css'
})
export class CadastroComponent {


  constructor(private router: Router){}


  cadastraSecretaria() {
    this.router.navigate(['cadastroSecretaria'])
  }

  cadastraAdmin() {
    this.router.navigate(['cadastroadmin'])
    }

    voltarParaHome() {
      this.router.navigate(['home'])
      }

  cadastraMedico() {
   this.router.navigate(['cadastroMedico'])
    }




}
