import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// ─── Regex Padrões ────────────────────────────────────────────────────────────

/** Apenas letras do alfabeto latino (PT-BR), espaços e hífens. Bloqueia cirílico, árabe, CJK, etc. */
const REGEX_NOME = /^[a-zA-ZÀ-ÿ\u00C0-\u017E\s'\-]+$/;

/** Apenas letras PT-BR e espaços (sem hífens) — para cidade, bairro, rua */
const REGEX_TEXTO_BR = /^[a-zA-ZÀ-ÿ\u00C0-\u017E0-9\s,.\-/º°ª]+$/;

/** Apenas dígitos numéricos */
const REGEX_NUMEROS = /^\d+$/;

/** CRM: apenas números, 4 a 6 dígitos */
const REGEX_CRM = /^\d{4,6}$/;

/** CRO: apenas números, 4 a 6 dígitos */
const REGEX_CRO = /^\d{4,6}$/;

/** RG: formato XX.XXX.XXX-X ou apenas dígitos */
const REGEX_RG = /^(\d{2}\.?\d{3}\.?\d{3}-?\d{1,2}|[A-Z]{2}-\d+)$/i;

/** CEP: 00000-000 */
const REGEX_CEP = /^\d{5}-\d{3}$/;

/** Telefone brasileiro: (00) 00000-0000 ou (00) 0000-0000 */
const REGEX_TELEFONE = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;

/** Nacionalidade: letras PT-BR + parênteses para M/F */
const REGEX_NACIONALIDADE = /^[a-zA-ZÀ-ÿ\u00C0-\u017E\s()\-]+$/;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Verifica se o valor possui caracteres de idiomas não-latinos (bloqueia entradas sem sentido) */
function contemCaracteresEstranhos(valor: string): boolean {
  // Detecta caracteres fora do range latino + básico
  return /[\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\u0900-\u097F]/.test(valor);
}

/** Verifica se o texto parece ser apenas repetição sem sentido (aaaa, 111, asdfgh) */
function pareceSpamDeCaracteres(valor: string): boolean {
  if (valor.length < 3) return false;
  const semEspacos = valor.replace(/\s/g, '');
  // Todos os caracteres iguais
  if (new Set(semEspacos).size === 1) return true;
  // Sequência do teclado (qwerty, asdf, 1234)
  const sequencias = ['qwerty', 'asdfgh', 'zxcvbn', '123456', 'abcdef'];
  return sequencias.some(seq => semEspacos.toLowerCase().includes(seq));
}

// ─── Validators ───────────────────────────────────────────────────────────────

/**
 * Valida nome completo:
 * - Obrigatório ter pelo menos 2 palavras (nome + sobrenome)
 * - Apenas letras PT-BR, acentos, espaços e hífens
 * - Mín. 3 / Máx. 100 caracteres
 * - Sem caracteres de outros alfabetos
 * - Sem spam de caracteres
 */
export function nomeCompletoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = control.value?.trim() ?? '';
    if (!valor) return null; // deixa o required cuidar

    if (contemCaracteresEstranhos(valor)) return { nomeCaracteresEstranhos: true };
    if (!REGEX_NOME.test(valor)) return { nomeCaracteresInvalidos: true };
    if (valor.length < 3) return { nomeMinLength: true };
    if (valor.length > 100) return { nomeMaxLength: true };
    if (pareceSpamDeCaracteres(valor)) return { nomeInvalido: true };

    const palavras = valor.split(/\s+/).filter(p => p.length > 0);
    if (palavras.length < 2) return { nomeSemSobrenome: true };
    if (palavras.some(p => p.length < 2)) return { nomePalavraCurta: true };

    return null;
  };
}

/**
 * Valida texto genérico em PT-BR (campo, bairro, rua, etc.)
 * - Apenas letras, números, espaços, vírgula, ponto, hífen
 * - Sem caracteres de outros alfabetos
 */
export function textoBrValidator(minLen = 2, maxLen = 100): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = control.value?.trim() ?? '';
    if (!valor) return null;

    if (contemCaracteresEstranhos(valor)) return { textoCaracteresEstranhos: true };
    if (!REGEX_TEXTO_BR.test(valor)) return { textoCaracteresInvalidos: true };
    if (valor.length < minLen) return { textoMinLength: { min: minLen, atual: valor.length } };
    if (valor.length > maxLen) return { textoMaxLength: { max: maxLen, atual: valor.length } };
    if (pareceSpamDeCaracteres(valor)) return { textoInvalido: true };

    return null;
  };
}

/**
 * Valida nacionalidade (ex: Brasileiro(a))
 */
export function nacionalidadeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = control.value?.trim() ?? '';
    if (!valor) return null;

    if (contemCaracteresEstranhos(valor)) return { textoCaracteresEstranhos: true };
    if (!REGEX_NACIONALIDADE.test(valor)) return { textoCaracteresInvalidos: true };
    if (valor.length < 3) return { textoMinLength: { min: 3, atual: valor.length } };
    if (valor.length > 50) return { textoMaxLength: { max: 50, atual: valor.length } };

    return null;
  };
}

/**
 * Valida data de nascimento:
 * - Não pode ser no futuro
 * - Profissional deve ter entre 18 e 100 anos
 */
export function dataNascimentoValidator(idadeMin = 18, idadeMax = 100): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (!valor) return null;

    const data = new Date(valor);
    if (isNaN(data.getTime())) return { dataInvalida: true };

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (data >= hoje) return { dataFutura: true };

    const idadeMs = hoje.getTime() - data.getTime();
    const idade = Math.floor(idadeMs / (1000 * 60 * 60 * 24 * 365.25));

    if (idade < idadeMin) return { idadeMinima: { min: idadeMin, atual: idade } };
    if (idade > idadeMax) return { idadeMaxima: { max: idadeMax } };

    return null;
  };
}

/**
 * Valida RG (opcional): formato numérico ou com pontos/hífen
 */
export function rgValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = control.value?.trim() ?? '';
    if (!valor) return null;

    const semFormatacao = valor.replace(/[\.\-]/g, '');
    if (!REGEX_NUMEROS.test(semFormatacao)) return { rgInvalido: true };
    if (semFormatacao.length < 7 || semFormatacao.length > 9) return { rgTamanhoInvalido: true };

    return null;
  };
}

/**
 * Valida CRM (apenas números, 4-6 dígitos)
 */
export function crmValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = control.value?.trim() ?? '';
    if (!valor) return null;

    if (!REGEX_CRM.test(valor)) return { crmInvalido: true };

    return null;
  };
}

/**
 * Valida CRO (mesmo formato que CRM)
 */
export function croValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = control.value?.trim() ?? '';
    if (!valor) return null;

    if (!REGEX_CRO.test(valor)) return { croInvalido: true };

    return null;
  };
}

/**
 * Valida registro do conselho dinamicamente (CRM ou CRO)
 * baseado no campo tipoProfissional do mesmo FormGroup
 */
export function registroConselhoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = control.value?.trim() ?? '';
    if (!valor) return null;

    // Tenta pegar o tipo do grupo pai
    const tipo = control.parent?.get('tipoProfissional')?.value ?? 'MEDICO';
    const regex = tipo === 'DENTISTA' ? REGEX_CRO : REGEX_CRM;

    if (!regex.test(valor)) {
      return tipo === 'DENTISTA' ? { croInvalido: true } : { crmInvalido: true };
    }

    return null;
  };
}

/**
 * Valida telefone brasileiro (opcional): (00) 00000-0000
 */
export function telefoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = control.value?.trim() ?? '';
    if (!valor) return null;

    if (!REGEX_TELEFONE.test(valor)) return { telefoneInvalido: true };

    return null;
  };
}

/**
 * Valida email com restrições extras:
 * - Sem caracteres de outros alfabetos
 * - Domínio deve ter pelo menos 2 caracteres
 */
export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = control.value?.trim() ?? '';
    if (!valor) return null;

    if (contemCaracteresEstranhos(valor)) return { emailCaracteresEstranhos: true };

    const regexEmail = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!regexEmail.test(valor)) return { emailInvalido: true };

    if (valor.length > 150) return { emailMaxLength: true };

    return null;
  };
}

/**
 * Valida CEP brasileiro: 00000-000
 */
export function cepValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = control.value?.trim() ?? '';
    if (!valor) return null;

    if (!REGEX_CEP.test(valor)) return { cepInvalido: true };

    return null;
  };
}

/**
 * Valida número de endereço: apenas inteiros positivos, máx 99999
 */
export function numeroEnderecoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (valor === null || valor === undefined || valor === '') return null;

    const num = Number(valor);
    if (!Number.isInteger(num) || num <= 0) return { numeroInvalido: true };
    if (num > 99999) return { numeroMaximo: true };

    return null;
  };
}

/**
 * Valida tempo de consulta: entre 5 e 180 minutos
 */
export function tempoConsultaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (valor === null || valor === undefined || valor === '') return null;

    const num = Number(valor);
    if (isNaN(num) || !Number.isInteger(num)) return { tempoInvalido: true };
    if (num < 5) return { tempoMinimo: true };
    if (num > 180) return { tempoMaximo: true };

    return null;
  };
}

/**
 * Valida formação/instituição (campo de texto livre, mas sem caracteres estranhos)
 */
export function formacaoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = control.value?.trim() ?? '';
    if (!valor) return null;

    if (contemCaracteresEstranhos(valor)) return { textoCaracteresEstranhos: true };
    if (valor.length < 3) return { textoMinLength: { min: 3, atual: valor.length } };
    if (valor.length > 120) return { textoMaxLength: { max: 120, atual: valor.length } };
    if (pareceSpamDeCaracteres(valor)) return { textoInvalido: true };

    return null;
  };
}