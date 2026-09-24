export interface PlanoAssinatura {
  id: number;
  nome: string;
  descricao: string;
  tipo: string;
  valorMensal: number;
  limiteAdminOrg: number | null;
  limiteProfissional: number | null;
  limiteSecretaria: number | null;
  valorAdicionalAdmin: number | null;
  valorAdicionalProfissional: number | null;
  valorAdicionalSecretaria: number | null;
  ativo: boolean;
  titulo?: string;
  recursos?: string[];

}

export interface PlanoAssinaturaRequest {
  nome: string;
  descricao: string;
  tipo: string;
  valorMensal: number;
  limiteAdminOrg: number | null;
  limiteProfissional: number | null;
  limiteSecretaria: number | null;
  valorAdicionalAdmin: number | null;
  valorAdicionalProfissional: number | null;
  valorAdicionalSecretaria: number | null;
  titulo?: string;
  recursos?: string[];

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
  limiteAdminOrgCustom: number | null;
  limiteProfissionalCustom: number | null;
  limiteSecretariaCustom: number | null;
  qtdAdminExtra: number;
  qtdProfissionalExtra: number;
  qtdSecretariaExtra: number;
  valorAdicionalPerfis: number;
  mpPreapprovalId: string | null;
  mpStatus: string | null;
  mpInitPoint: string | null;
  mpPayerEmail: string | null;
  cortesia: boolean;
  dataCancelamento: string | null;
  canceladoPor: string | null;
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
  formaPagamento: string | null;
  mpPaymentId: string | null;
  motivoRecusa: string | null;
  txid: string | null;
  dataPagamento: string | null;
  criadaEm: string;
}

/** Link do checkout hospedado do Mercado Pago para ativar a assinatura. */
export interface LinkPagamento {
  preapprovalId: string;
  initPoint: string;
  payerEmail: string;
  valorMensal: number;
}

/** Payload do auto-cadastro público (landing page). */
export interface CadastroSaasRequest {
  tipoPessoa: string;
  nome: string;
  cpf: string;
  cargo?: string;
  email: string;
  nomeClinica?: string;
  razaoSocial?: string;
  cnpj?: string;
  tipoClinica?: string;
  emailClinica?: string;
  telefone?: string;
  cep: string;
  uf: string;
  municipio: string;
  bairro?: string;
  rua: string;
  numero: number;
  complemento?: string;
  planoId: number;
}

export interface CadastroSaasResponse {
  organizacaoId: number;
  adminId: number;
  mensagem: string;
}

export interface CustomizarPlanoTenantRequest {
  limiteAdminOrgCustom: number | null;
  limiteProfissionalCustom: number | null;
  limiteSecretariaCustom: number | null;
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
