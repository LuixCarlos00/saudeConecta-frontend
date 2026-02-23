import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { ProntuarioStateService } from 'src/app/services/state/prontuario-state.service';
import Swal from 'sweetalert2';

/**
 * Guard para proteger a rota do Prontuário Médico
 * Garante que o componente só seja acessado através do botão "Iniciar Consulta"
 * com dados válidos da consulta
 */
@Injectable({
  providedIn: 'root'
})
export class ProntuarioGuard implements CanActivate {

  constructor(
    private router: Router,
    private prontuarioState: ProntuarioStateService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    
    // Verificar se existe uma consulta no estado
    let consultaAtual: any = null;
    
    this.prontuarioState.consulta$.subscribe(consulta => {
      consultaAtual = consulta;
    }).unsubscribe();

    // Se não há consulta ou a consulta está vazia, bloquear acesso
    if (!consultaAtual || !consultaAtual.id) {
      Swal.fire({
        icon: 'warning',
        title: 'Acesso Negado',
        text: 'Para acessar o prontuário, você deve iniciar uma consulta através da agenda médica.',
        confirmButtonText: 'Ir para Agenda',
        confirmButtonColor: '#667eea'
      }).then(() => {
        this.router.navigate(['/Agenda-Medico']);
      });
      
      return false;
    }

    // Verificar se a consulta tem os dados mínimos necessários
    if (!consultaAtual.pacienteNome || !consultaAtual.profissionalId) {
      Swal.fire({
        icon: 'error',
        title: 'Dados Incompletos',
        text: 'A consulta não possui todos os dados necessários. Por favor, inicie novamente.',
        confirmButtonText: 'Voltar',
        confirmButtonColor: '#667eea'
      }).then(() => {
        this.router.navigate(['/Agenda-Medico']);
      });
      
      return false;
    }

    // Tudo OK, permitir acesso
    return true;
  }
}
