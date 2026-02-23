import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import Swal, { SweetAlertResult } from 'sweetalert2';

/**
 * Mapeamento de erros de duplicação do banco de dados
 */
interface DuplicateErrorMapping {
  key: string;
  message: string;
}

/**
 * Serviço centralizado para tratamento de erros e notificações
 * Elimina duplicação de código de tratamento de erros nos componentes
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

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
   * Exibe mensagem de sucesso
   */
  showSuccess(message: string, title: string = 'Sucesso'): void {
    Swal.fire({
      icon: 'success',
      title,
      text: message,
      confirmButtonColor: '#5ccf6c'
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

  /**
   * Exibe mensagem informativa
   */
  showInfo(message: string, title: string = 'Informação'): void {
    Swal.fire({
      icon: 'info',
      title,
      text: message,
      confirmButtonColor: '#3085d6'
    });
  }

  /**
   * Exibe diálogo de confirmação
   * @returns Promise<boolean> - true se confirmado, false se cancelado
   */
  async confirm(
    message: string,
    title: string = 'Confirmação',
    confirmText: string = 'Sim',
    cancelText: string = 'Não'
  ): Promise<boolean> {
    const result: SweetAlertResult = await Swal.fire({
      icon: 'warning',
      title,
      text: message,
      showCancelButton: true,
      confirmButtonColor: '#5ccf6c',
      cancelButtonColor: '#d33',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText
    });

    return result.isConfirmed;
  }

  /**
   * Exibe diálogo de confirmação para exclusão
   */
  async confirmDelete(itemName: string = 'este item'): Promise<boolean> {
    return this.confirm(
      `Tem certeza que deseja excluir ${itemName}? Esta ação não pode ser desfeita.`,
      'Confirmar Exclusão',
      'Sim, excluir',
      'Cancelar'
    );
  }

  /**
   * Exibe diálogo de confirmação para conclusão
   */
  async confirmComplete(itemName: string = 'este registro'): Promise<boolean> {
    return this.confirm(
      `Tem certeza que deseja concluir ${itemName}?`,
      'Confirmar Conclusão',
      'Sim, concluir',
      'Cancelar'
    );
  }
}
