export interface logradouro {
    codigo: number;
    nacionalidade: string;
    uf: string;
    municipio: string;
    bairro: string;
    cep: string;
    rua: string;
    numero: number;
    complemento: number;
}


export interface EnderecoViaCep {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
    ibge: string;
    gia: string;
    ddd: string;
    siafi: string;
    // Campos adicionais retornados pela ViaCEP
    unidade?: string;
    estado?: string;
    regiao?: string;
    erro?: boolean; // Propriedade opcional para CEP não encontrado
}