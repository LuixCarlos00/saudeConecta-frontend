export type StatusMensagem = 'PENDENTE' | 'ENVIADO' | 'FALHOU' | 'RENOTIFICADO';
export type TipoMensagem =
    | 'EMAIL_CREDENCIAIS_CLINICO'
    | 'EMAIL_CREDENCIAIS_SECRETARIA'
    | 'EMAIL_CREDENCIAIS_ADMINISTRADOR'
    | 'EMAIL_RECUPERACAO_SENHA'
    | 'EMAIL_GENERICO';


export interface MensageriaResponse {
    id: number;
    organizacaoId: number;
    destinatarioProfissionalId: number | null;
    destinatarioProfissionalNome: string | null;
    destinatarioEmail: string;
    destinatarioNome: string;
    assunto: string;
    corpoMensagem: string;
    tipoMensagem: TipoMensagem;
    status: StatusMensagem;
    erroDetalhe: string | null;
    tentativas: number;
    adminNotificado: boolean;
    dataCriacao: string;
    dataAtualizacao: string;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}