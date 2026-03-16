/**
 * Retorna a primeira mensagem de erro para um controle de formulário.
 * Uso no HTML: {{ getFieldError(form.get('campo')) }}
 */
export function getFieldError(errors: Record<string, any> | null | undefined): string {
    if (!errors) return '';

    const mensagens: Record<string, string> = {
        // Obrigatório
        required: '⚠️ Campo obrigatório.',

        // Nome
        nomeCaracteresEstranhos: '❌ Nome contém caracteres de outro idioma. Use apenas letras portuguesas.',
        nomeCaracteresInvalidos: '❌ Nome inválido — use apenas letras e acentos. Ex: "João da Silva".',
        nomeMinLength: '❌ Nome muito curto — mínimo 3 caracteres.',
        nomeMaxLength: '❌ Nome muito longo — máximo 100 caracteres.',
        nomeSemSobrenome: '❌ Informe nome e sobrenome. Ex: "Maria Oliveira".',
        nomePalavraCurta: '❌ Cada parte do nome precisa ter pelo menos 2 letras.',
        nomeInvalido: '❌ Nome parece inválido. Verifique o que foi digitado.',

        // Texto genérico BR
        textoCaracteresEstranhos: '❌ Contém caracteres de outro idioma. Use apenas letras portuguesas.',
        textoCaracteresInvalidos: '❌ Caracteres inválidos — use apenas letras, números e espaços.',
        textoMinLength: '❌ Texto muito curto.',
        textoMaxLength: '❌ Texto muito longo.',
        textoInvalido: '❌ Conteúdo parece inválido. Verifique o que foi digitado.',

        // Data de nascimento
        dataInvalida: '❌ Data inválida.',
        dataFutura: '❌ A data de nascimento não pode ser no futuro.',
        idadeMinima: '❌ O profissional deve ter pelo menos 18 anos.',
        idadeMaxima: '❌ Data de nascimento fora do intervalo permitido.',

        // CPF
        cpfInvalid: '❌ CPF inválido — verifique os dígitos. Ex: 000.000.000-00.',
        cpfRequired: '⚠️ CPF é obrigatório.',

        // RG
        rgInvalido: '❌ RG inválido — use apenas números. Ex: 12.345.678-9.',
        rgTamanhoInvalido: '❌ RG deve ter entre 7 e 9 dígitos.',

        // CRM / CRO
        crmInvalido: '❌ CRM inválido — informe apenas os números (4 a 6 dígitos). Ex: 123456.',
        croInvalido: '❌ CRO inválido — informe apenas os números (4 a 6 dígitos). Ex: 12345.',

        // Telefone
        telefoneInvalido: '❌ Telefone inválido. Ex: (31) 99999-0000.',

        // Email
        email: '❌ E-mail inválido. Ex: nome@clinica.com.',
        emailInvalido: '❌ E-mail inválido. Ex: nome@clinica.com.',
        emailCaracteresEstranhos: '❌ E-mail contém caracteres inválidos.',
        emailMaxLength: '❌ E-mail muito longo — máximo 150 caracteres.',

        // CEP
        cepInvalido: '❌ CEP inválido — use o formato 00000-000.',

        // Número de endereço
        numeroInvalido: '❌ Número inválido — informe um número inteiro positivo.',
        numeroMaximo: '❌ Número muito alto — verifique o endereço.',

        // Tempo de consulta
        tempoInvalido: '❌ Tempo inválido — informe um número inteiro de minutos.',
        tempoMinimo: '❌ Tempo mínimo de consulta é 5 minutos.',
        tempoMaximo: '❌ Tempo máximo de consulta é 180 minutos.',

        // Tamanho genérico
        maxlength: '❌ Limite de caracteres excedido.',
        minlength: '❌ Mínimo de caracteres não atingido.',
    };

    for (const key of Object.keys(errors)) {
        if (mensagens[key]) return mensagens[key];
    }

    return '❌ Campo inválido.';
}