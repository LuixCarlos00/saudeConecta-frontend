/**
 * API pública da área "assinatura": só o que outras áreas podem usar.
 * Outras áreas importam daqui (`src/app/features/assinatura`), nunca de um caminho interno.
 */
export { ModalAssociarPlanoComponent } from './components/modal-associar-plano/modal-associar-plano.component';

/** Lista de assinaturas do SUPER_ADMIN; a auditoria usa para montar o filtro de clínicas. */
export { AssinaturaAdminApiService } from './data-access/assinatura-admin-api.service';
