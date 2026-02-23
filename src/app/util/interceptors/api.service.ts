import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiUrlService } from 'src/app/services/api/api-url.service';
import { tokenService } from '../Token/Token.service';

@Injectable({
  providedIn: 'root'
})
export class ApiInterceptor implements HttpInterceptor {

  constructor(
    private tokenService: tokenService,
    private apiUrlService: ApiUrlService
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.tokenService.retornaToken();

    // Verifica se a requisição é para o endpoint de login
    if (req.url.endsWith('/Home/login') || req.url.endsWith('/Home/buscarUsuarioExistente')) {
      // Se for uma requisição de login, não adicionar o token
      return next.handle(req);
    }

    // Se não for uma requisição de login, adicionar o token
    const clonedRequest = req.clone({
      withCredentials: true,
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });

    return next.handle(clonedRequest);
  }
}
