import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { CpfValidator } from './cpf.validator';

export function cpfValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const cpf = control.value;
    
    if (!cpf) {
      return null; // Não valida se estiver vazio (use Validators.required separadamente)
    }
    
    const isValid = CpfValidator.isValid(cpf);
    
    return isValid ? null : { cpfInvalid: true };
  };
}
