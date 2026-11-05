import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { RascunhoAtendimentoApiService } from 'src/app/services/api/rascunho-atendimento-api.service';
import { extrairMensagemErro } from 'src/app/shared/utils/mensagem-erro-http';
import { ProntuarioStateService } from 'src/app/services/state/prontuario-state.service';
import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';

/** Status em que a consulta já foi encerrada e não aceita mais atendimento. */
const STATUS_ENCERRADOS = ['REALIZADA', 'PAGO', 'CANCELADA'];

const TEXTO_ACESSO_NEGADO =
  'Para acessar o prontuário, você deve iniciar uma consulta através da agenda médica.';

/**
 * Guard para proteger a rota do Prontuário Médico/Odontológico.
 *
 * - Com consulta em memória (veio da agenda): libera e, se a URL não traz o id, redireciona para a rota com id.
 * - Com `:consultaId` na URL e sem consulta em memória (F5, voltar, outro computador): carrega a consulta
 *   pela API, confere que é do profissional logado e que não está encerrada, e põe no state.
 * - Sem nada: bloqueia e manda para a agenda.
 */
@Injectable({
  providedIn: 'root'
})
export class ProntuarioGuard implements CanActivate {

  constructor(
    private notificacao: NotificacaoService,
    private router: Router,
    private prontuarioState: ProntuarioStateService,
    private consultaApi: ConsultaApiService,
    private rascunhoApi: RascunhoAtendimentoApiService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean> {

    let consultaAtual: any = null;
    this.prontuarioState.consulta$.subscribe(consulta => {
      consultaAtual = consulta;
    }).unsubscribe();

    const idDaUrl = Number(route.paramMap?.get('consultaId')) || null;
    const memoriaValida = !!consultaAtual?.id && (!idDaUrl || consultaAtual.id === idDaUrl);

    if (memoriaValida) {
      return this.liberarComConsultaEmMemoria(consultaAtual, idDaUrl, route);
    }

    if (idDaUrl) {
      return this.carregarPelaApi(idDaUrl);
    }

    return this.bloquear('Acesso Negado', TEXTO_ACESSO_NEGADO);
  }

  /**
   * Libera o acesso com a consulta do state; sem id na URL, redireciona para a rota com id.
   */
  private liberarComConsultaEmMemoria(consulta: any, idDaUrl: number | null, route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (!consulta.pacienteNome || !consulta.profissionalId) {
      return this.bloquear(
        'Dados Incompletos',
        'A consulta não possui todos os dados necessários. Por favor, inicie novamente.',
        'Voltar',
        'error'
      );
    }
    if (!idDaUrl) {
      const base = route.routeConfig?.path?.startsWith('startconsulta-dentista')
        ? 'startconsulta-dentista'
        : 'startconsulta';
      return this.router.createUrlTree([base, consulta.id]);
    }
    return true;
  }

  /**
   * Carrega a consulta da URL, valida dono e status, e a coloca no state.
   */
  private carregarPelaApi(consultaId: number): Observable<boolean> {
    return this.consultaApi.buscarPorId(consultaId).pipe(
      switchMap(consulta => {
        if (STATUS_ENCERRADOS.includes(String(consulta?.status))) {
          return of(this.bloquear(
            'Acesso Negado',
            'Esta consulta já foi encerrada e não pode mais ser atendida. Abra outra consulta pela agenda.'
          ));
        }
        // A rota por id não informa o usuário dono; o GET do rascunho é a prova de posse (200/204 = dono,
        // 404 = outro usuário). O rascunho baixado fica no state para o componente não repetir o GET.
        return this.rascunhoApi.buscar(consulta.id).pipe(
          map(rascunho => {
            this.prontuarioState.setRascunhoPreCarregado(consulta.id, rascunho);
            this.prontuarioState.setConsulta(consulta);
            return true;
          }),
          catchError((erro: HttpErrorResponse) => of(
            erro?.status === 404
              ? this.bloquear('Acesso Negado', TEXTO_ACESSO_NEGADO)
              : this.bloquear('Erro', extrairMensagemErro(erro) || 'Não foi possível verificar o acesso a esta consulta.', 'Ir para Agenda', 'error')
          ))
        );
      }),
      catchError(() => of(this.bloquear('Acesso Negado', TEXTO_ACESSO_NEGADO)))
    );
  }

  private bloquear(titulo: string, texto: string, botao = 'Ir para Agenda', icone: 'warning' | 'error' = 'warning'): false {
    this.notificacao.fire({
      icon: icone,
      title: titulo,
      text: texto,
      confirmButtonText: botao,
      confirmButtonColor: '#667eea'
    }).then(() => {
      this.router.navigate(['/agenda-calendario']);
    });
    return false;
  }
}
