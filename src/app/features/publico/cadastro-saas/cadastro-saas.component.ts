import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CadastroPublicoApiService } from 'src/app/services/api/cadastro-publico-api.service';
import { CepApiService } from 'src/app/services/api/cep-api.service';
import { PlanoApiService } from 'src/app/services/api/plano-api.service';
import { CpfValidator } from 'src/app/util/validators/cpf.validator';
import { cpfValidator } from 'src/app/util/validators/cpf-form.validator';
import { getFieldError } from 'src/app/util/validators/field-errors';
import {
  antiInjectionValidator,
  cepValidator,
  cnpjValidator,
  emailValidator,
  nomeCompletoValidator,
  numeroEnderecoValidator,
  telefoneValidator,
  textoBrValidator,
} from 'src/app/util/validators/form-validators';
import { PlanoAssinatura } from 'src/app/util/variados/interfaces/planos/PlanoAssinatura';

/**
 * Auto-cadastro SaaS a partir da landing page.
 * Fluxo em etapas: tipo de pessoa → administrador → organização (PJ) →
 * endereço → plano → confirmação. Não exige cartão: o tenant nasce com
 * 30 dias de teste gratuito.
 */
@Component({
  selector: 'app-cadastro-saas',
  templateUrl: './cadastro-saas.component.html',
  styleUrls: ['./cadastro-saas.component.css'],
})
export class CadastroSaasComponent implements OnInit {

  formulario!: FormGroup;
  planos: PlanoAssinatura[] = [];
  isJuridica = true;
  isLoading = false;
  isBuscandoCep = false;
  isLoadingPlanos = false;
  etapaAtual = 0;
  getFieldError = getFieldError;

  /** Campos exigidos apenas quando o cadastro é de pessoa jurídica. */
  private readonly camposJuridica = ['nomeClinica', 'razaoSocial', 'cnpj', 'tipoClinica', 'emailClinica', 'telefone'];

  readonly tiposClinica = [
    { value: 'CLINICA_MEDICA', label: 'Clínica Médica' },
    { value: 'CLINICA_ODONTOLOGICA', label: 'Clínica Odontológica' },
    { value: 'MISTA', label: 'Clínica Mista' },
    { value: 'CLINICA', label: 'Clínica' },
    { value: 'CONSULTORIO', label: 'Consultório' },
    { value: 'HOSPITAL', label: 'Hospital' },
    { value: 'LABORATORIO', label: 'Laboratório' },
    { value: 'UPA', label: 'UPA' },
  ];

  readonly ufs = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
    'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  ];

  constructor(
    private fb: FormBuilder,
    private cadastroPublicoApi: CadastroPublicoApiService,
    private cepApiService: CepApiService,
    private planoApiService: PlanoApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.formulario = this.fb.group({
      tipoPessoa:   ['JURIDICA', Validators.required],

      nome:         ['', [Validators.required, nomeCompletoValidator(), antiInjectionValidator()]],
      cpf:          ['', [Validators.required, cpfValidator()]],
      email:        ['', [Validators.required, emailValidator()]],

      nomeClinica:  ['', [Validators.required, textoBrValidator(3, 100), antiInjectionValidator()]],
      razaoSocial:  ['', [Validators.required, textoBrValidator(3, 150), antiInjectionValidator()]],
      cnpj:         ['', [Validators.required, cnpjValidator()]],
      tipoClinica:  ['', Validators.required],
      emailClinica: ['', [Validators.required, emailValidator()]],
      telefone:     ['', [Validators.required, telefoneValidator()]],

      cep:          ['', [Validators.required, cepValidator()]],
      uf:           ['', Validators.required],
      municipio:    ['', [Validators.required, textoBrValidator(2, 100), antiInjectionValidator()]],
      bairro:       ['', [Validators.required, textoBrValidator(2, 100), antiInjectionValidator()]],
      rua:          ['', [Validators.required, textoBrValidator(2, 200), antiInjectionValidator()]],
      numero:       ['', [Validators.required, numeroEnderecoValidator()]],
      complemento:  ['', antiInjectionValidator()],

      planoId:      ['', Validators.required],
    });

    this.aplicarMascaras();
    this.carregarPlanos();
  }

  /** Etapas visíveis: a de organização só existe para pessoa jurídica. */
  get etapas(): string[] {
    const base = ['Tipo', 'Administrador', 'Organização', 'Endereço', 'Plano', 'Confirmação'];
    return this.isJuridica ? base : base.filter(e => e !== 'Organização');
  }

  get etapaNome(): string {
    return this.etapas[this.etapaAtual];
  }

  get isUltimaEtapa(): boolean {
    return this.etapaAtual === this.etapas.length - 1;
  }

  get planoSelecionado(): PlanoAssinatura | undefined {
    const id = Number(this.formulario.get('planoId')?.value);
    return this.planos.find(p => p.id === id);
  }

  private carregarPlanos(): void {
    this.isLoadingPlanos = true;
    this.planoApiService.listarPlanosAtivos().subscribe({
      next: (planos) => {
        this.planos = planos;
        this.isLoadingPlanos = false;
        this.preSelecionarPlanoDaUrl();
      },
      error: () => {
        this.isLoadingPlanos = false;
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível carregar os planos.' });
      }
    });
  }

  /** Respeita o plano escolhido no card da landing (`/cadastro?plano=2`). */
  private preSelecionarPlanoDaUrl(): void {
    const planoParam = this.route.snapshot.queryParamMap.get('plano');
    if (planoParam && this.planos.some(p => p.id === Number(planoParam))) {
      this.formulario.patchValue({ planoId: planoParam });
    }
  }

  private aplicarMascaras(): void {
    this.formulario.get('cpf')?.valueChanges.subscribe(valor => {
      if (!valor) return;
      const formatado = CpfValidator.format(valor);
      if (formatado !== valor) {
        this.formulario.get('cpf')?.setValue(formatado, { emitEvent: false });
      }
    });

    this.formulario.get('cnpj')?.valueChanges.subscribe(valor => {
      if (!valor) return;
      const formatado = this.formatarCnpj(valor);
      if (formatado !== valor) {
        this.formulario.get('cnpj')?.setValue(formatado, { emitEvent: false });
      }
    });

    this.formulario.get('cep')?.valueChanges.subscribe(valor => {
      if (!valor) return;
      const formatado = this.formatarCep(valor);
      if (formatado !== valor) {
        this.formulario.get('cep')?.setValue(formatado, { emitEvent: false });
      }
    });
  }

  onTipoPessoaChange(): void {
    this.isJuridica = this.formulario.get('tipoPessoa')?.value === 'JURIDICA';

    this.camposJuridica.forEach(campo => {
      const controle = this.formulario.get(campo);
      if (this.isJuridica) {
        controle?.addValidators([Validators.required]);
      } else {
        controle?.removeValidators([Validators.required]);
      }
      controle?.updateValueAndValidity();
    });
  }

  buscarCep(): void {
    const cep = this.formulario.get('cep')?.value?.replace(/[^0-9]/g, '');
    if (!cep || cep.length !== 8) return;

    this.isBuscandoCep = true;
    this.cepApiService.buscarEnderecoPorCep(cep).subscribe({
      next: (data) => {
        this.isBuscandoCep = false;
        this.formulario.patchValue({
          rua:       data.logradouro || '',
          bairro:    data.bairro     || '',
          municipio: data.localidade || '',
          uf:        data.uf         || '',
        });
      },
      error: () => {
        this.isBuscandoCep = false;
        Swal.fire({ icon: 'warning', title: 'CEP não encontrado', text: 'Verifique o CEP informado.' });
      }
    });
  }

  avancar(): void {
    const campos = this.camposDaEtapa(this.etapaNome);
    const invalidos = campos.filter(campo => this.formulario.get(campo)?.invalid);

    if (invalidos.length > 0) {
      invalidos.forEach(campo => this.formulario.get(campo)?.markAsTouched());
      Swal.fire({ icon: 'warning', title: 'Campos pendentes', text: 'Revise os campos destacados antes de continuar.' });
      return;
    }

    if (!this.isUltimaEtapa) {
      this.etapaAtual++;
    }
  }

  voltar(): void {
    if (this.etapaAtual > 0) {
      this.etapaAtual--;
    } else {
      this.router.navigate(['/']);
    }
  }

  /** Campos validados antes de liberar a próxima etapa. */
  private camposDaEtapa(etapa: string): string[] {
    switch (etapa) {
      case 'Tipo':          return ['tipoPessoa'];
      case 'Administrador': return ['nome', 'cpf', 'email'];
      case 'Organização':   return this.camposJuridica;
      case 'Endereço':      return ['cep', 'uf', 'municipio', 'bairro', 'rua', 'numero'];
      case 'Plano':         return ['planoId'];
      default:              return [];
    }
  }

  cadastrar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      Swal.fire({ icon: 'warning', title: 'Formulário incompleto', text: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    this.isLoading = true;
    const valores = this.formulario.value;
    const payload = {
      ...valores,
      numero: parseInt(valores.numero, 10),
      planoId: parseInt(valores.planoId, 10),
    };

    this.cadastroPublicoApi.cadastrar(payload).subscribe({
      next: (resposta) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'success',
          title: 'Cadastro realizado!',
          html: `${resposta.mensagem}<br><br>
                 Seu login é o <strong>${this.isJuridica ? 'CNPJ' : 'CPF'}</strong> informado.<br>
                 Você tem <strong>30 dias grátis</strong>, sem cartão.`,
          confirmButtonText: 'Ir para o login'
        }).then(() => this.router.navigate(['/login']));
      },
      error: (erro) => {
        this.isLoading = false;
        this.tratarErro(erro);
      }
    });
  }

  private tratarErro(erro: any): void {
    let mensagem = 'Não foi possível concluir o cadastro. Tente novamente.';
    if (erro.status === 429) {
      mensagem = 'Muitas tentativas de cadastro a partir deste dispositivo. Tente novamente mais tarde.';
    } else if (erro.status === 409) {
      mensagem = typeof erro.error === 'string' ? erro.error : 'CPF ou CNPJ já cadastrado no sistema.';
    } else if (typeof erro.error === 'string') {
      mensagem = erro.error;
    } else if (erro.error?.message) {
      mensagem = erro.error.message;
    }
    Swal.fire({ icon: 'error', title: 'Erro no cadastro', text: mensagem });
  }

  formatarValor(valor: number | undefined): string {
    return (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private formatarCnpj(valor: string): string {
    const n = valor.replace(/[^\d]/g, '');
    if (n.length <= 2)  return n;
    if (n.length <= 5)  return n.replace(/(\d{2})(\d+)/, '$1.$2');
    if (n.length <= 8)  return n.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
    if (n.length <= 12) return n.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
    return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
  }

  private formatarCep(valor: string): string {
    const n = valor.replace(/[^\d]/g, '');
    if (n.length <= 5) return n;
    return n.replace(/(\d{5})(\d+)/, '$1-$2');
  }
}
