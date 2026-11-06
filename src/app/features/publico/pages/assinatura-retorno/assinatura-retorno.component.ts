import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * Página de retorno do checkout hospedado do Mercado Pago (`back_url`).
 *
 * A confirmação real da assinatura chega pelo webhook — esta tela apenas
 * orienta o cliente, já que o Mercado Pago pode redirecionar antes do
 * processamento terminar.
 */
@Component({
  selector: 'app-assinatura-retorno',
  templateUrl: './assinatura-retorno.component.html',
  styleUrls: ['./assinatura-retorno.component.css'],
})
export class AssinaturaRetornoComponent implements OnInit {

  /** 'sucesso' ou 'pendente', definido pela rota. */
  situacao: 'sucesso' | 'pendente' = 'sucesso';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.situacao = this.route.snapshot.data['situacao'] === 'pendente' ? 'pendente' : 'sucesso';
  }

  get titulo(): string {
    return this.situacao === 'sucesso'
      ? 'Assinatura enviada para aprovação!'
      : 'Pagamento pendente de confirmação';
  }

  get mensagem(): string {
    return this.situacao === 'sucesso'
      ? 'Recebemos o cadastro do seu cartão. Assim que o Mercado Pago confirmar a autorização, sua assinatura será ativada automaticamente — normalmente em alguns minutos.'
      : 'O Mercado Pago ainda está processando o pagamento. Você receberá a confirmação por e-mail e a assinatura será ativada automaticamente quando for aprovada.';
  }

  irParaMinhaAssinatura(): void {
    this.router.navigate(['/minha-assinatura']);
  }

  irParaLogin(): void {
    this.router.navigate(['/login']);
  }
}
