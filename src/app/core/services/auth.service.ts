import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, takeUntil, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

import { ApiUrlService } from '../../services/api/api-url.service';
import { API_ENDPOINTS } from '../../shared/constants/api-endpoints.constant';
import { Role, ALLOWED_ROLES, isValidRole } from '../../shared/constants/roles.constant';

/**
 * Interface para dados decodificados do token JWT
 */
export interface DecodedToken {
  id: number;
  sub: string;
  aud: string;
  exp: number;
  iss: string;
  organizacaoId?: number;
  tipoUsuario?: number;
  perfil?: string;
  tipoProfissional?: string;
}

/**
 * Interface para credenciais de login
 */
export interface LoginCredentials {
  login: string;
  senha: string;
}

/**
 * Interface para resposta de login
 */
export interface LoginResponse {
  token: string;
  usuarioView?: {
    id: number;
    login: string;
    roles: string;
  };
}

/**
 * Chaves de armazenamento local
 */
const STORAGE_KEYS = {
  TOKEN: 'authToken'
} as const;

/**
 * Serviço de autenticação centralizado
 * Gerencia login, logout, tokens e estado do usuário
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {

  private readonly destroy$ = new Subject<void>();
  private readonly apiUrl: string;

  // Estado do usuário logado
  private readonly currentUserSubject = new BehaviorSubject<DecodedToken | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  // Estado de autenticação
  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private apiUrlService: ApiUrlService
  ) {
    this.apiUrl = this.apiUrlService.getUrl();
    this.initializeAuthState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa o estado de autenticação ao carregar o serviço
   */
  private initializeAuthState(): void {
    const token = this.getToken();
    if (token && this.isTokenValid(token)) {
      this.decodeAndSetUser(token);
      this.isAuthenticatedSubject.next(true);
    } else {
      this.clearAuthState();
    }
  }

  // ========== Métodos de Login/Logout ==========

  /**
   * Realiza login do usuário
   */
  login(credentials: LoginCredentials): Observable<HttpResponse<LoginResponse>> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}${API_ENDPOINTS.AUTH.LOGIN}`,
      credentials,
      { observe: 'response' }
    );
  }

  /**
   * Processa resposta de login bem-sucedido
   */
  handleLoginSuccess(token: string): boolean {
    this.saveToken(token);
    const decoded = this.decodeAndSetUser(token);

    if (!decoded) {
      this.clearAuthState();
      return false;
    }

    // Verifica se a role é permitida
    if (!this.hasAllowedRole(decoded.aud)) {
      this.clearAuthState();
      return false;
    }

    this.isAuthenticatedSubject.next(true);
    return true;
  }

  /**
   * Realiza logout do usuário
   */
  logout(): void {
    this.clearAuthState();
    this.router.navigate(['/login']);
  }

  /**
   * Limpa todo o estado de autenticação
   */
  private clearAuthState(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  // ========== Métodos de Token ==========

  /**
   * Salva token no localStorage
   */
  saveToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }

  /**
   * Obtém token do localStorage
   */
  getToken(): string {
    return localStorage.getItem(STORAGE_KEYS.TOKEN) ?? '';
  }

  /**
   * Verifica se existe token
   */
  hasToken(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /**
   * Remove token do localStorage
   */
  removeToken(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }

  /**
   * Verifica se o token é válido (não expirado)
   */
  isTokenValid(token: string): boolean {
    if (!token) {
      return false;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp > currentTime;
    } catch (error) {
      console.error('[AuthService] Erro ao validar token:', error);
      return false;
    }
  }

  /**
   * Decodifica token e atualiza estado do usuário
   */
  private decodeAndSetUser(token: string): DecodedToken | null {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      this.currentUserSubject.next(decoded);
      return decoded;
    } catch (error) {
      console.error('[AuthService] Erro ao decodificar token:', error);
      return null;
    }
  }

  // ========== Métodos de Verificação ==========

  /**
   * Verifica se o usuário está autenticado (token válido)
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return this.hasToken() && this.isTokenValid(token);
  }

  /**
   * Verifica se o usuário está logado (alias para isAuthenticated)
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Obtém a role do usuário atual
   */
  getUserRole(): string {
    let user = this.currentUserSubject.getValue();
    
    // Se não tem usuário no subject mas tem token, tenta decodificar
    if (!user && this.hasToken()) {
      const token = this.getToken();
      if (this.isTokenValid(token)) {
        user = this.decodeAndSetUser(token);
      }
    }
    
    return user?.aud ?? '';
  }

  /**
   * Verifica se a role é permitida no sistema
   */
  hasAllowedRole(role: string): boolean {
    // Verifica se contém alguma das roles permitidas (baseado em TipoUsuarioNovo)
    return role.includes('ROLE_SUPER_ADMIN') || 
           role.includes('ROLE_ADMIN') || 
           role.includes('ROLE_PROFISSIONAL') || 
           role.includes('ROLE_RECEPCIONISTA');
  }

  /**
   * Verifica se o usuário tem uma role específica
   */
  hasRole(role: Role): boolean {
    return this.getUserRole() === role;
  }

  /**
   * Verifica se o usuário é administrador
   */
  isAdmin(): boolean {
    return this.hasRole(Role.ADMIN);
  }

  /**
   * Verifica se o usuário é médico
   */
  isDoctor(): boolean {
    return this.hasRole(Role.DOCTOR);
  }

  /**
   * Verifica se o usuário é secretária
   */
  isSecretary(): boolean {
    return this.hasRole(Role.SECRETARY);
  }

  /**
   * Obtém dados do usuário atual
   */
  getCurrentUser(): DecodedToken | null {
    return this.currentUserSubject.getValue();
  }

  /**
   * Obtém o ID da organização do usuário atual
   */
  getOrganizacaoId(): number | null {
    const user = this.getCurrentUser();
    return user?.organizacaoId ?? null;
  }

  /**
   * Verifica se o usuário pertence a uma organização
   */
  hasOrganization(): boolean {
    return this.getOrganizacaoId() !== null;
  }

  /**
   * Obtém o perfil do usuário atual
   */
  getUserProfile(): string {
    const user = this.getCurrentUser();
    console.log('AuthService - getCurrentUser:', user);
    console.log('AuthService - perfil:', user?.perfil);
    return user?.perfil ?? '';
  }

  /**
   * Verifica se o usuário tem um perfil específico
   */
  hasProfile(profile: string): boolean {
    const currentProfile = this.getUserProfile();
    console.log(`AuthService - hasProfile(${profile}): currentProfile="${currentProfile}", result=${currentProfile === profile}`);
    return currentProfile === profile;
  }

  /**
   * Verifica se o usuário é ROOT (Super Administrador)
   */
  isRoot(): boolean {
    return this.hasProfile('ROOT');
  }

  /**
   * Verifica se o usuário é GESTOR
   */
  isGestor(): boolean {
    return this.hasProfile('GESTOR');
  }

  /**
   * Verifica se o usuário é CLINICO
   */
  isClinico(): boolean {
    return this.hasProfile('CLINICO');
  }

  /**
   * Verifica se o usuário é ASSISTENTE
   */
  isAssistente(): boolean {
    return this.hasProfile('ASSISTENTE');
  }

  /**
   * Obtém a especialização do clínico logado (MEDICO ou DENTISTA).
   *
   * @returns tipo do profissional ou string vazia quando não aplicável
   */
  getTipoProfissional(): string {
    return this.getCurrentUser()?.tipoProfissional ?? '';
  }

  /**
   * Verifica se o clínico logado é médico.
   *
   * @returns true quando o tipo profissional é MEDICO
   */
  isMedico(): boolean {
    return this.getTipoProfissional() === 'MEDICO';
  }

  /**
   * Verifica se o clínico logado é dentista.
   *
   * @returns true quando o tipo profissional é DENTISTA
   */
  isDentista(): boolean {
    return this.getTipoProfissional() === 'DENTISTA';
  }

  /**
   * Verifica se é super admin (sem organização)
   */
  isSuperAdmin(): boolean {
    const role = this.getUserRole();
    return role.includes('ROLE_SUPER_ADMIN');
  }

  /**
   * Verifica se é admin de organização
   */
  isOrgAdmin(): boolean {
    const role = this.getUserRole();
    return role.includes('ROLE_ADMIN') && !role.includes('ROLE_SUPER_ADMIN');
  }

  /**
   * Verifica se é profissional
   */
  isProfissional(): boolean {
    const role = this.getUserRole();
    return role.includes('ROLE_PROFISSIONAL');
  }

  /**
      * Verifica se é recepcionista
      */
     isRecepcionista(): boolean {
       const role = this.getUserRole();
       return role.includes('ROLE_RECEPCIONISTA');
     }

  // ========== Métodos de API ==========

  /**
   * Verifica se um usuário existe
   */
  checkUserExists(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}${API_ENDPOINTS.AUTH.CHECK_USER}/${username}`);
  }
}
