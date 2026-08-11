export type CategoriaChamado =
    | 'DUVIDA_TECNICA'
    | 'PROBLEMA_SISTEMA'
    | 'SUGESTAO_MELHORIA'
    | 'SOLICITACAO_FUNCIONALIDADE'
    | 'OUTROS';

export type PrioridadeChamado = 'BAIXA' | 'MEDIA' | 'ALTA';

export type StatusChamado = 'EM_ANALISE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

export interface ChamadoAnexoRequest {
    nomeArquivo: string;
    tipoConteudo: string | null;
    conteudoBase64: string;
}

export interface ChamadoSuporteRequest {
    titulo: string;
    corpo: string;
    categoria: CategoriaChamado;
    prioridade: PrioridadeChamado;
    anexos?: ChamadoAnexoRequest[];
}

export interface AtualizarStatusChamadoRequest {
    status: StatusChamado;
    observacao?: string | null;
}

export interface ChamadoAnexoResponse {
    id: number;
    nomeArquivo: string;
    tipoConteudo: string | null;
    tamanhoBytes: number | null;
    conteudoBase64: string;
    dataCriacao: string;
}

export interface ChamadoSuporteResponse {
    id: string;
    protocolo: string;
    organizacaoId: number;
    usuarioCriadorId: number;
    criadorNome: string | null;
    criadorEmail: string | null;
    titulo: string;
    corpo: string;
    categoria: CategoriaChamado;
    categoriaDescricao: string;
    prioridade: PrioridadeChamado;
    prioridadeDescricao: string;
    status: StatusChamado;
    statusDescricao: string;
    previsaoAtendimento: string | null;
    dataCriacao: string;
    dataAtualizacao: string;
    anexos: ChamadoAnexoResponse[];
}
