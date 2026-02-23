import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// Services
import { AuthService } from './services/auth.service';
import { ErrorHandlerService } from './services/error-handler.service';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { RoleGuard } from './guards/role.guard';

// Interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { NgrokInterceptor } from './interceptors/ngrok.interceptor';

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
    ErrorHandlerService,

    // Guards
    AuthGuard,
    GuestGuard,
    RoleGuard,

    // Interceptors (ordem importa!)
    {
      provide: HTTP_INTERCEPTORS,
      useClass: NgrokInterceptor,
      multi: true
    },
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
