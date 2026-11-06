import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Interceptor para adicionar header do ngrok
 * Necessário para desenvolvimento com túnel ngrok
 */
@Injectable()
export class NgrokInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const modifiedRequest = request.clone({
      setHeaders: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    return next.handle(modifiedRequest);
  }
}
