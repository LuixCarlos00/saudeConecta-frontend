import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { API_ENDPOINTS } from '../../shared/constants/api-endpoints.constant';

/**
 * Endpoints que não requerem autenticação
 */
const PUBLIC_ENDPOINTS: string[] = [
  API_ENDPOINTS.AUTH.LOGIN,
  API_ENDPOINTS.AUTH.CHECK_USER,
  API_ENDPOINTS.AUTH.REGISTER
];

/**
 * Interceptor para adicionar token de autenticação nas requisições
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Verifica se é um endpoint público
    if (this.isPublicEndpoint(request.url)) {
      return next.handle(request);
    }

    // Obtém token
    const token = this.authService.getToken();
    // Se não tem token, continua sem modificar
    if (!token) {
      return next.handle(request);
    }

    // Clona a requisição adicionando o token
    const authenticatedRequest = request.clone({
      withCredentials: true,
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next.handle(authenticatedRequest);
  }

  /**
   * Verifica se o endpoint é público (não requer autenticação)
   */
  private isPublicEndpoint(url: string): boolean {
    return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
  }
}
