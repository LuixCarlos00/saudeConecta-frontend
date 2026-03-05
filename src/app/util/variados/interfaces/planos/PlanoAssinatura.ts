export interface PlanoAssinatura {
  id: number;
  nome: string;
  descricao: string;
  tipo: string;
  valorMensal: number;
  limiteAdminOrg: number | null;
  limiteProfissional: number | null;
  limiteSecretaria: number | null;
  ativo: boolean;
}

export interface PlanoAssinaturaRequest {
  nome: string;
  descricao: string;
  tipo: string;
  valorMensal: number;
  limiteAdminOrg: number | null;
  limiteProfissional: number | null;
  limiteSecretaria: number | null;
}

export interface AssinaturaTenant {
  id: number;
  organizacaoId: number;
  organizacaoNome: string;
  planoId: number;
  planoNome: string;
  planoTipo: string;
  status: string;
  dataInicio: string;
  dataVencimento: string;
  dataProximaCobranca: string;
  valorMensal: number;
  criadoEm: string;
}

export interface AssinaturaTenantRequest {
  organizacaoId: number;
  planoId: number;
}

export interface CobrancaTenant {
  id: number;
  assinaturaId: number;
  organizacaoId: number;
  organizacaoNome: string;
  planoNome: string;
  valorTotal: number;
  status: string;
  pixCopiaECola: string;
  pixQrcodeBase64: string;
  txid: string;
  dataVencimentoPix: string;
  dataPagamento: string | null;
  criadaEm: string;
}

export interface LimitesPlano {
  planoNome: string;
  planoTipo: string;
  limiteAdminOrg: number | null;
  limiteProfissional: number | null;
  limiteSecretaria: number | null;
  usadoAdminOrg: number;
  usadoProfissional: number;
  usadoSecretaria: number;
  podeAdicionarAdminOrg: boolean;
  podeAdicionarProfissional: boolean;
  podeAdicionarSecretaria: boolean;
}
