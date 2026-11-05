import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal, { SweetAlertIcon, SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

/**
 * Mapeamento de erros de duplicação do banco de dados
 */
interface DuplicateErrorMapping {
  key: string;
  message: string;
}

/**
 * Ponto único de mensagens ao usuário: alertas (SweetAlert2), toasts e snackbars,
 * além da tradução de erros HTTP em mensagem.
 *
 * É o único arquivo do app que importa `sweetalert2`. Os componentes chamam `fire`
 * com as mesmas opções que passariam ao `Swal.fire`, ou os atalhos `showError`,
 * `showSuccessToast` e `showWarning`.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificacaoService {

  constructor(private snackBar: MatSnackBar) { }

  /**
   * Mapeamento de erros de duplicação conhecidos
   */
  private readonly duplicateErrorMappings: DuplicateErrorMapping[] = [
    // Paciente
    { key: 'paciente.PaciEmail_UNIQUE', message: 'Já existe um paciente registrado com esse email.' },
    { key: 'paciente.PaciCpf_UNIQUE', message: 'Já existe um paciente registrado com esse CPF.' },
    { key: 'paciente.PaciRg_UNIQUE', message: 'Já existe um paciente registrado com esse RG.' },
    // Médico
    { key: 'medico.MedEmail_UNIQUE', message: 'Já existe um médico registrado com esse email.' },
    { key: 'medico.MedCrm_UNIQUE', message: 'Já existe um médico registrado com esse CRM.' },
    { key: 'medico.MedCpf_UNIQUE', message: 'Já existe um médico registrado com esse CPF.' },
    // Secretária
    { key: 'secretaria.SecEmail_UNIQUE', message: 'Já existe uma secretária registrada com esse email.' },
    { key: 'secretaria.SecCpf_UNIQUE', message: 'Já existe uma secretária registrada com esse CPF.' },
    // Usuário
    { key: 'usuario.login_UNIQUE', message: 'Este login já está em uso.' },
  ];

  /**
   * Trata erros HTTP e exibe mensagem apropriada
   * @param error Erro HTTP recebido
   * @param context Contexto da operação (ex: 'cadastro', 'atualização')
   */
  handleHttpError(error: HttpErrorResponse, context: string = 'operação'): void {
    const message = this.getErrorMessage(error, context);
    this.showError(message);
    this.logError(error, context);
  }

  /**
   * Obtém mensagem de erro apropriada baseada no tipo de erro
   */
  private getErrorMessage(error: HttpErrorResponse, context: string): string {
    // Erro sem corpo
    if (!error.error) {
      return this.getGenericErrorMessage(error.status, context);
    }

    // Verifica erros de duplicação
    const duplicateMessage = this.checkDuplicateError(error.error);
    if (duplicateMessage) {
      return duplicateMessage;
    }

    // Erro com mensagem string
    if (typeof error.error === 'string') {
      return error.error;
    }

    // Erro com objeto message
    if (error.error?.message) {
      return error.error.message;
    }

    return `Erro ao realizar ${context}. Tente novamente.`;
  }

  /**
   * Verifica se é um erro de duplicação e retorna a mensagem apropriada
   */
  private checkDuplicateError(errorBody: string): string | null {
    if (typeof errorBody !== 'string' || !errorBody.includes('Duplicate entry')) {
      return null;
    }

    for (const mapping of this.duplicateErrorMappings) {
      if (errorBody.includes(mapping.key)) {
        return mapping.message;
      }
    }

    return 'Registro duplicado. Verifique os dados informados.';
  }

  /**
   * Retorna mensagem genérica baseada no status HTTP
   */
  private getGenericErrorMessage(status: number, context: string): string {
    const statusMessages: Record<number, string> = {
      400: 'Dados inválidos. Verifique as informações.',
      401: 'Sessão expirada. Faça login novamente.',
      403: 'Você não tem permissão para esta ação.',
      404: 'Recurso não encontrado.',
      409: 'Conflito de dados. Registro já existe.',
      422: 'Dados não processáveis. Verifique o formulário.',
      500: 'Erro interno do servidor. Tente novamente mais tarde.',
      502: 'Servidor indisponível. Tente novamente.',
      503: 'Serviço temporariamente indisponível.',
    };

    return statusMessages[status] || `Erro desconhecido ao realizar ${context}.`;
  }

  /**
   * Loga erro no console para debugging
   */
  private logError(error: HttpErrorResponse, context: string): void {
    console.error(`[ErrorHandler] Erro em ${context}:`, {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      error: error.error
    });
  }

  // ========== Métodos de Notificação ==========

  /**
   * Abre um alerta SweetAlert2 (mesma assinatura do `Swal.fire`).
   *
   * @param options opções do alerta, ou título/html/ícone na forma curta
   * @returns promessa com o resultado (isConfirmed, value...)
   */
  fire<T = any>(options: SweetAlertOptions): Promise<SweetAlertResult<Awaited<T>>>;
  fire<T = any>(title?: string, html?: string, icon?: SweetAlertIcon): Promise<SweetAlertResult<Awaited<T>>>;
  fire<T = any>(...args: any[]): Promise<SweetAlertResult<Awaited<T>>> {
    return (Swal.fire as (...a: any[]) => Promise<SweetAlertResult<Awaited<T>>>)(...args);
  }

  /**
   * Mostra o spinner de carregamento dentro do alerta aberto (usar em `didOpen`).
   */
  mostrarCarregando(): void {
    Swal.showLoading();
  }

  /**
   * Toast no canto superior direito por 3s, com barra de progresso e pausa no hover.
   *
   * @param icone tipo do toast (success, error...)
   * @param titulo texto exibido
   */
  mostrarToast(icone: SweetAlertIcon, titulo: string): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    Toast.fire({
      icon: icone,
      title: titulo
    });
  }

  /**
   * Mensagem discreta no rodapé (MatSnackBar) com botão "Fechar".
   *
   * @param mensagem texto exibido
   * @param duracaoMs tempo em milissegundos até fechar sozinha
   */
  mostrarSnackbar(mensagem: string, duracaoMs: number): void {
    this.snackBar.open(mensagem, 'Fechar', { duration: duracaoMs });
  }

  /**
   * Exibe mensagem de erro
   */
  showError(message: string, title: string = 'Erro'): void {
    Swal.fire({
      icon: 'error',
      title,
      text: message,
      confirmButtonColor: '#d33'
    });
  }

  /**
   * Exibe mensagem de sucesso com auto-fechamento
   */
  showSuccessToast(message: string, duration: number = 1500): void {
    Swal.fire({
      icon: 'success',
      title: message,
      showConfirmButton: false,
      timer: duration
    });
  }

  /**
   * Exibe mensagem de aviso
   */
  showWarning(message: string, title: string = 'Atenção'): void {
    Swal.fire({
      icon: 'warning',
      title,
      text: message,
      confirmButtonColor: '#f0ad4e'
    });
  }

}
