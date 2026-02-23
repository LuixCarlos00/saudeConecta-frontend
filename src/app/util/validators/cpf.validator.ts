export class CpfValidator {
  
  /**
   * Valida se um CPF é válido
   * @param cpf CPF sem formatação (apenas números) ou formatado
   * @returns boolean true se CPF é válido, false caso contrário
   */
  static isValid(cpf: string): boolean {
    if (!cpf) return false;
    
    // Remove caracteres não numéricos
    const cpfLimpo = cpf.replace(/[^\d]/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpfLimpo.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais (CPFs inválidos como 111.111.111-11)
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
    
    // Calcula dígitos verificadores
    let soma = 0;
    let resto: number;
    
    // Validação do primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;
    
    // Validação do segundo dígito verificador
    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;
    
    return true;
  }
  
  /**
   * Formata CPF no padrão XXX.XXX.XXX-XX
   * @param cpf CPF com apenas números
   * @returns string CPF formatado
   */
  static format(cpf: string): string {
    if (!cpf) return '';
    
    const cpfLimpo = cpf.replace(/[^\d]/g, '');
    
    if (cpfLimpo.length !== 11) return cpfLimpo;
    
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  /**
   * Remove formatação do CPF
   * @param cpf CPF formatado
   * @returns string CPF apenas números
   */
  static clean(cpf: string): string {
    if (!cpf) return '';
    return cpf.replace(/[^\d]/g, '');
  }
}
