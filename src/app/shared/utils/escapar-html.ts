const MAPA_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapa caracteres especiais de HTML para uso seguro em templates montados por string (ex.: Swal html).
 *
 * @param valor texto qualquer (null/undefined viram string vazia)
 * @returns texto com & < > " ' substituídos por entidades HTML
 */
export function escaparHtml(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  return String(valor).replace(/[&<>"']/g, caractere => MAPA_ESCAPE[caractere]);
}
