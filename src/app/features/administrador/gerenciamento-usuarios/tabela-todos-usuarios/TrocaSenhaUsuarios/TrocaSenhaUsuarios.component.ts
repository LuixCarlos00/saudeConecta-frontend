import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { UsuarioApiService } from 'src/app/services/api/usuario-api.service';

@Component({
  selector: 'app-TrocaSenhaUsuarios',
  templateUrl: './TrocaSenhaUsuarios.component.html',
  styleUrls: ['./TrocaSenhaUsuarios.component.css'],
})
export class TrocaSenhaUsuariosComponent implements OnInit {
  novaSenha: string = '';
  showPassword: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<TrocaSenhaUsuariosComponent>,
    @Inject(MAT_DIALOG_DATA) public elements: { elements: any },
    private usuarioApiService: UsuarioApiService
  ) { }

  ngOnInit() {
    console.log(this.elements);
  }

  /** Calcula a força da senha (0-100) */
  getPasswordStrength(): number {
    if (!this.novaSenha) return 0;

    let strength = 0;
    const password = this.novaSenha;

    // Comprimento
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;

    // Caracteres especiais
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[a-z]/.test(password)) strength += 10;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;

    return Math.min(strength, 100);
  }

  /** Retorna a classe CSS baseada na força da senha */
  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    if (strength < 30) return 'strength-weak';
    if (strength < 60) return 'strength-medium';
    if (strength < 80) return 'strength-good';
    return 'strength-strong';
  }

  /** Retorna o texto descritivo da força da senha */
  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    if (strength < 30) return 'Fraca';
    if (strength < 60) return 'Média';
    if (strength < 80) return 'Boa';
    return 'Forte';
  }

  TrocaSenha() {
    if (this.novaSenha == '') {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Preencha todos os campos',
        showCloseButton: true,
      });
      return;
    }

    const codigo = this.elements.elements.usuarioId || 0;

    if (!codigo) {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'ID do usuário não encontrado',
        showCloseButton: true,
      });
      return;
    }

    this.usuarioApiService.trocarSenharUsuariobyOrg(codigo, this.novaSenha).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Sucesso',
          text: 'Senha alterada com sucesso',
          showCloseButton: true,
        }).then(() => {
          this.dialogRef.close(true);
        });
      },
      error: (error) => {
        console.error('Erro ao trocar senha:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível alterar a senha. Tente novamente.',
          showCloseButton: true,
        });
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword; // Alterna a visibilidade da senha
  }
}
