import { AdministradorApiService } from './../../../services/api/administrador-api.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfissionalApiService } from 'src/app/services/api/profissional-api.service';
import { UsuarioApiService } from 'src/app/services/api/usuario-api.service';
import { CepApiService } from 'src/app/services/api/cep-api.service';
import { tokenService } from 'src/app/util/Token/Token.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { EspecialidadeApiService } from "../../../services/api/especialidade-api.service";

@Component({
  selector: 'app-DadosPessoais',
  templateUrl: './DadosPessoais.component.html',
  styleUrls: ['./DadosPessoais.component.css'],
})
export class DadosPessoaisComponent implements OnInit, OnDestroy {
  UsuarioLogado: any = {
    id: 0,
    aud: '',
    exp: '',
    iss: '',
    sub: '',
  };

  //TODO: Implementar funcionalidade de histórico de alterações dos dados pessoais,
  // para registrar cada atualização feita pelo usuário, incluindo data e campos alterados.
  // criar uma tabela de historio de dados pessoais,
  // onde cada linha representa uma atualização feita pelo usuário,
  //  mostrando a data da atualização e os campos que foram alterados.
  //  ao altualizar os dados pessoais, comparar os novos valores com os antigos e registrar
  //   as mudanças na tabela de histórico.

  dadosPessoaisForm: FormGroup;
  enderecoForm: FormGroup;
  IdRegistro: number = 0;
  IdEndereco: number = 0;

  isLoading: boolean = true;
  activeTab: 'pessoais' | 'endereco' | 'profissional' = 'pessoais';
  tipoUsuario: string = '';
  isProfissional: boolean = false;
  isAdmin: boolean = false;
  private cepSubscription?: Subscription;

  // Propriedades para especialidades
  especialidades: any[] = [];
  isLoadingEspecialidades: boolean = false;

  constructor(
    private tokenService: tokenService,
    private profissionalApiService: ProfissionalApiService,
    private usuarioApiService: UsuarioApiService,
    private cepApiService: CepApiService,
    private especialidadeService: EspecialidadeApiService,
    private AdministradorApiService: AdministradorApiService,
    private fb: FormBuilder
  ) {
    // Inicialize sempre com form completo - será reconfigurado no ngOnInit
    this.dadosPessoaisForm = this.fb.group({
      nome: ['', Validators.required],
      sexo: ['', Validators.required],
      registroConselho: ['', Validators.required],
      conselho: [''],           // CRM / CRO readonly
      rg: [''],
      email: ['', [Validators.required, Validators.email]],
      dataNascimento: ['', Validators.required],
      cpf: ['', Validators.required],
      especialidade: ['', Validators.required],
      telefone: [''],
      tempoConsultaMinutos: ['', Validators.required],
      valorConsulta: [''],
      formacao: [''],
      instituicao: [''],
      status: [''],
      tipoProfissional: [''],
      cargo: [''],
    });

    this.enderecoForm = this.fb.group({
      rua: ['', Validators.required],
      numero: ['', Validators.required],
      complemento: [''],
      bairro: ['', Validators.required],
      cep: ['', Validators.required],
      municipio: ['', Validators.required],
      uf: ['', Validators.required],
      nacionalidade: [''],
    });

    this.tokenService.decodificaToken();
    this.tokenService.UsuarioLogadoValue$.subscribe((paciente) => {
      if (paciente) this.UsuarioLogado = paciente;
    });
  }

  ngOnInit() {
    this.isLoading = true;
    this.configurarListenerCep();
    this.carregarEspecialidades();
    this.usuarioApiService
      .buscarPerfilCompleto(this.UsuarioLogado.id)
      .subscribe({
        next: (dados) => {
          console.log('dados', dados);
          this.tipoUsuario = dados.tipoUsuario || '';
          this.isProfissional = dados.tipoUsuario === 'PROFISSIONAL';
          this.isAdmin = dados.tipoUsuario === 'ADMIN_ORG';

          if (this.isProfissional && dados.profissional) {
            this.carregarDadosProfissional(dados.profissional);
          } else if (this.isAdmin && dados.adminOrganizacao) {
            this.carregarDadosAdmin(dados.adminOrganizacao);
          }

          if (dados.endereco) {
            this.carregarEndereco(dados.endereco);
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar dados:', error);
          this.isLoading = false;
          Swal.fire({
            icon: 'error',
            title: 'Erro ao carregar dados',
            text: 'Não foi possível carregar seus dados. Tente novamente.',
          });
        }
      });
  }


  private configurarListenerCep(): void {
    this.cepSubscription = this.enderecoForm.get('cep')?.valueChanges.subscribe(value => {
      if (value) {
        const formatted = this.cepApiService.formatarCep(value);
        if (formatted !== value) {
          this.enderecoForm.get('cep')?.setValue(formatted, { emitEvent: false });
        }

        if (this.cepApiService.limparCep(value).length === 8) {
          this.buscarEnderecoPorCep(this.cepApiService.limparCep(value));
        }
      }
    });
  }

  private buscarEnderecoPorCep(cep: string): void {
    this.cepApiService.buscarEnderecoPorCep(cep).subscribe({
      next: (endereco) => {
        this.enderecoForm.patchValue({
          rua: endereco.logradouro,
          bairro: endereco.bairro,
          municipio: endereco.localidade,
          uf: endereco.uf,
          complemento: endereco.complemento
        });

        this.mostrarFeedbackCep('success', 'Endereço encontrado!');
      },
      error: (error) => {
        console.error('Erro ao buscar CEP:', error);
        this.mostrarFeedbackCep('error', 'CEP não encontrado. Preencha o endereço manualmente.');
      }
    });
  }

  private mostrarFeedbackCep(tipo: 'success' | 'error', mensagem: string): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    Toast.fire({
      icon: tipo,
      title: mensagem
    });
  }

  // 2. carregarDadosProfissional — mapear todos os campos corretamente
  private carregarDadosProfissional(profissional: any): void {
    this.IdRegistro = profissional.id;

    const especialidadePrincipal = profissional.especialidades?.length > 0
      ? profissional.especialidades[0].nome
      : '';

    this.dadosPessoaisForm.patchValue({
      nome: profissional.nome,
      sexo: profissional.sexo || '',          // MASCULINO / FEMININO direto
      registroConselho: profissional.registroConselho,
      conselho: profissional.conselho || '',      // CRM / CRO
      rg: profissional.rg || '',
      email: profissional.email,
      dataNascimento: profissional.dataNascimento || '',
      cpf: profissional.cpf,
      especialidade: especialidadePrincipal,
      telefone: profissional.telefone || '',
      tempoConsultaMinutos: profissional.tempoConsultaMinutos,
      valorConsulta: profissional.valorConsulta,
      formacao: profissional.formacao || '',
      instituicao: profissional.instituicao || '',
      status: profissional.status || '',
      tipoProfissional: profissional.tipoProfissional || '',
    });
  }

  private carregarDadosAdmin(admin: any): void {
    console.log('Carregando dados do administrador:', admin);
    this.IdRegistro = admin.id;

    this.dadosPessoaisForm.patchValue({
      nome: admin.nome,
      cargo: admin.cargo || '',
      email: admin.email,
    });
  }

  private carregarEndereco(endereco: any): void {
    this.IdEndereco = endereco.endCodigo || 0;
    this.enderecoForm.patchValue({
      rua: endereco.endRua,
      numero: endereco.endNumero,
      complemento: endereco.endComplemento,
      bairro: endereco.endBairro,
      cep: endereco.endCep,
      municipio: endereco.endMunicipio,
      uf: endereco.endUF,
      nacionalidade: endereco.endNacionalidade,
    });
  }

  salvar() {
    if (this.isProfissional) {
      this.salvarProfissional();
    } else if (this.isAdmin) {
      this.salvarAdmin();
    }
  }

  private prepararDadosAdmin(): any {
    const formValues = this.dadosPessoaisForm.value;

    return {
      nome: formValues.nome,
      email: formValues.email,
      cargo: formValues.cargo,
      endereco: this.prepararEndereco()
    };
  }

  // 3. prepararDadosProfissional — enviar sexo como string direta
  private prepararDadosProfissional(): any {
    const formValues = this.dadosPessoaisForm.value;

    return {
      nome: formValues.nome,
      cpf: formValues.cpf,
      rg: formValues.rg || null,
      registroConselho: formValues.registroConselho,
      telefone: formValues.telefone || '',
      email: formValues.email,
      sexo: formValues.sexo,               // MASCULINO / FEMININO
      dataNascimento: formValues.dataNascimento || null,
      formacao: formValues.formacao || null,
      instituicao: formValues.instituicao || null,
      tempoConsultaMinutos: formValues.tempoConsultaMinutos || 30,
      valorConsulta: formValues.valorConsulta || 0,
      tipoProfissional: formValues.tipoProfissional || null,
      especialidade: formValues.especialidade,
      endereco: this.prepararEndereco()
    };
  }



  private prepararEndereco(): any {
    const formValues = this.enderecoForm.value;

    return {
      codigo: this.IdEndereco || null,
      nacionalidade: formValues.nacionalidade || null,
      uf: formValues.uf,
      municipio: formValues.municipio,
      bairro: formValues.bairro,
      cep: formValues.cep,
      rua: formValues.rua,
      numero: formValues.numero ? parseInt(formValues.numero.toString(), 10) : null,
      complemento: formValues.complemento || null
    };
  }

  private salvarProfissional(): void {
    if (this.dadosPessoaisForm.invalid || this.enderecoForm.invalid) {
      this.dadosPessoaisForm.markAllAsTouched();
      this.enderecoForm.markAllAsTouched();

      Swal.fire({
        icon: 'warning',
        title: 'Campos obrigatórios',
        text: 'Por favor, preencha todos os campos obrigatórios marcados com *',
      });
      return;
    }

    const dadosAtualizados = this.prepararDadosProfissional();
    console.log('Dados preparados para atualização do profissional:', dadosAtualizados);
    this.profissionalApiService
      .atualizarClinicoIdByOrg(this.IdRegistro, dadosAtualizados)
      .subscribe({
        next: () => {
          this.exibirSucessoSalvar();
        },
        error: (error) => {
          console.error('Erro ao atualizar dados pessoais:', error);
          Swal.fire({
            icon: 'error',
            title: 'Erro ao salvar',
            text: 'Não foi possível atualizar os dados. Tente novamente.',
          });
        },
      });
  }

  private salvarAdmin(): void {
    console.log('Salvando dados do administrador...', this.dadosPessoaisForm);
    if (this.dadosPessoaisForm.invalid) {
      this.dadosPessoaisForm.markAllAsTouched();

      Swal.fire({
        icon: 'warning',
        title: 'Campos obrigatórios',
        text: 'Por favor, preencha todos os campos obrigatórios marcados com *',
      });
      return;
    }

    const dadosAtualizados = this.prepararDadosAdmin();
    console.log('Dados preparados para atualização do administrador:', dadosAtualizados);
    this.AdministradorApiService
      .atualizarAdmByOrg(this.IdRegistro, dadosAtualizados)
      .subscribe({
        next: () => {
          this.exibirSucessoSalvar();
        },
        error: (error) => {
          console.error('Erro ao atualizar dados do administrador:', error);
          Swal.fire({
            icon: 'error',
            title: 'Erro ao salvar',
            text: 'Não foi possível atualizar os dados. Tente novamente.',
          });
        },
      });
  }

  private exibirSucessoSalvar(): void {
    Swal.fire({
      icon: 'success',
      title: 'Dados atualizados com sucesso',
      showConfirmButton: false,
      timer: 2500,
    });
  }

  getCampoErro(campo: string): string {
    const control = this.dadosPessoaisForm?.get(campo) ||
      this.dadosPessoaisForm?.get(campo) ||
      this.enderecoForm.get(campo);

    if (control?.hasError('required')) {
      return 'Este campo é obrigatório';
    }
    if (control?.hasError('email')) {
      return 'E-mail inválido';
    }
    return '';
  }

  ngOnDestroy(): void {
    if (this.cepSubscription) {
      this.cepSubscription.unsubscribe();
    }
  }

  // Propriedades para modal de especialidade
  mostrarModalEspecialidade: boolean = false;
  novaEspecialidadeNome: string = '';

  // Método para abrir modal de nova especialidade
  abrirModalNovaEspecialidade(): void {
    this.mostrarModalEspecialidade = true;
    this.novaEspecialidadeNome = '';
  }

  // Método para fechar modal de especialidade
  fecharModalEspecialidade(): void {
    this.mostrarModalEspecialidade = false;
    this.novaEspecialidadeNome = '';
  }

  // Método para criar nova especialidade
  criarNovaEspecialidade(): void {
    if (!this.novaEspecialidadeNome || this.novaEspecialidadeNome.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Campo obrigatório',
        text: 'Por favor, informe o nome da especialidade.',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    const request = {
      tipoProfissionalId: 1,
      nome: this.novaEspecialidadeNome.trim(),
      codigo: this.novaEspecialidadeNome.trim().toUpperCase().replace(/\s+/g, '_')
    };

    this.especialidadeService.criar(request).subscribe({
      next: (novaEspecialidade) => {
        // Adiciona a nova especialidade à lista
        this.especialidades.push(novaEspecialidade);

        // Seleciona a nova especialidade no formulário
        this.dadosPessoaisForm.get('especialidade')?.setValue(novaEspecialidade.nome);

        // Fecha o modal
        this.fecharModalEspecialidade();

        Swal.fire({
          icon: 'success',
          title: 'Especialidade adicionada!',
          text: `A especialidade "${novaEspecialidade.nome}" foi adicionada com sucesso.`,
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Erro ao criar especialidade:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erro!',
          text: 'Ocorreu um erro ao adicionar a especialidade. Tente novamente.',
          timer: 3000,
          showConfirmButton: false
        });
      }
    });
  }

  // Carregar especialidades (pode ser chamado no ngOnInit)
  private carregarEspecialidades(): void {
    this.isLoadingEspecialidades = true;

    // Aqui você pode fazer uma chamada à API para carregar especialidades
    // Por enquanto, vamos usar alguns dados de exemplo
    this.especialidadeService.carregarEspecialidades().subscribe({
      next: (especialidades) => {
        this.especialidades = especialidades;
        this.isLoadingEspecialidades = false;
      },
      error: (error) => {
        console.error('Erro ao carregar especialidades:', error);
        // Dados de exemplo em caso de erro
        this.especialidades = [
          { id: 1, nome: 'Cardiologia' },
          { id: 2, nome: 'Clínica Geral' },
          { id: 3, nome: 'Pediatria' },
          { id: 4, nome: 'Ginecologia' },
          { id: 5, nome: 'Ortopedia' }
        ];
        this.isLoadingEspecialidades = false;
      }
    });
  }
}
