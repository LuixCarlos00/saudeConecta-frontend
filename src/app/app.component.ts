import { AuthService } from 'src/app/core/services/auth.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'saudeConecta';

  constructor(
    private authService: AuthService
  ) {}

  /**
   * Verifica se o usuário está logado
   */
  estaLogado(): boolean {
    return this.authService.isLoggedIn();
  }
}
