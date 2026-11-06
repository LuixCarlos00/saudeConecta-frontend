import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// Services
import { AuthService } from './auth/auth.service';
import { NotificacaoService } from './notificacao/notificacao.service';

// Guards
import { AuthGuard } from './auth/guards/auth.guard';
import { GuestGuard } from './auth/guards/guest.guard';
import { RoleGuard } from './auth/guards/role.guard';

// Interceptors
import { AuthInterceptor } from './auth/interceptors/auth.interceptor';
import { ErrorInterceptor } from './http/interceptors/error.interceptor';
import { NgrokInterceptor } from './http/interceptors/ngrok.interceptor';
import { environment } from '../../environments/environment';

/**
 * Módulo Core - Singleton services, guards e interceptors
 * Este módulo deve ser importado APENAS no AppModule
 */
@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  exports: [
    HttpClientModule
  ],
  providers: [
    // Services
    AuthService,
    NotificacaoService,

    // Guards
    AuthGuard,
    GuestGuard,
    RoleGuard,

    // Interceptors (ordem importa!)
    // Header do ngrok só faz sentido em desenvolvimento
    ...(environment.production ? [] : [{
      provide: HTTP_INTERCEPTORS,
      useClass: NgrokInterceptor,
      multi: true
    }]),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ]
})
export class CoreModule {
  /**
   * Previne importação múltipla do CoreModule
   * Garante que seja um singleton
   */
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error(
        'CoreModule já foi carregado. Importe-o apenas no AppModule.'
      );
    }
  }
}
