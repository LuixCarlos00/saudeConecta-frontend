import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { PacienteApiService } from 'src/app/services/api/paciente-api.service';
import { ProfissionalApiService } from 'src/app/services/api/profissional-api.service';
import { AdministradorApiService } from 'src/app/services/api/administrador-api.service';
import { UsuarioUnificado } from '../tabela-todos-usuarios.component';
import { SecretariaApiService } from 'src/app/services/api/secretaria-api.service';
import { ufOptions } from 'src/app/util/variados/options/options';
import { EspecialidadeService, EspecialidadeResponse } from 'src/app/services/api/especialidade.service';

export interface DialogData {
  usuario: UsuarioUnificado;
}

@Component({
  selector: 'app-visualizar-editar-usuario',
  templateUrl: './visualizar-editar-usuario.component.html',
  styleUrls: ['./visualizar-editar-usuario.component.css']
})
export class VisualizarEditarUsuarioComponent implements OnInit {

  private destroy$ = new Subject<void>();

  especialidades: EspecialidadeResponse[] = [];
  ufOptionsLista = ufOptions;

  formulario!: FormGroup;
  categoria: string = '';
  isLoading = false;
  isLoadingEspecialidades = false;
  isEditMode = false;
  dadosOriginais: any = {};
  mostrarModalNovaEspecialidade = false;
  novaEspecialidadeNome = '';
  tipoProfissionalSelecionado: string = 'MEDICO';

  constructor(
    public dialogRef: MatDialogRef<VisualizarEditarUsuarioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private fb: FormBuilder,
    private pacienteApiService: PacienteApiService,
    private profissionalApiService: ProfissionalApiService,
    private administradorApiService: AdministradorApiService,
    private secretariaApiService: SecretariaApiService,
    private especialidadeService: EspecialidadeService
  ) {
    this.categoria = data.usuario.categoria;
  }

  ngOnInit(): void {
    this.inicializarFormulario();
    if (this.categoria === 'Clinico') {
      this.carregarEspecialidades();
    }
    this.carregarDados();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private inicializarFormulario(): void {
    switch (this.categoria) {
      case 'Paciente':
        this.formulario = this.fb.group({
          codigo: [{ value: '', disabled: true }],
          nome: ['', [Validators.required, Validators.maxLength(100)]],
          cpf: [{ value: '', disabled: true }],          // readonly
          sexo: ['', [Validators.required]],              // obrigatório
          dataNascimento: ['', [Validators.required]],              // obrigatório
          rg: ['', [Validators.maxLength(12)]],         // opcional
          email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
          telefone: ['', [Validators.maxLength(20)]],         // opcional
          // Endereço
          codigoEndereco: [''],
          nacionalidade: ['', [Validators.maxLength(50)]],         // opcional
          uf: ['', [Validators.required, Validators.maxLength(2)]],
          municipio: ['', [Validators.required, Validators.maxLength(100)]],
          bairro: ['', [Validators.required, Validators.maxLength(100)]],
          cep: ['', [Validators.required, Validators.maxLength(10)]],
          rua: ['', [Validators.required, Validators.maxLength(200)]],
          numero: ['', [Validators.required]],
          complemento: ['', [Validators.maxLength(100)]],
        });
        break;

      case 'Clinico':
        this.formulario = this.fb.group({
          codigo: [{ value: '', disabled: true }],
          cpf: [{ value: '', disabled: true }],
          tipoProfissional: ['MEDICO', [Validators.required]],
          conselho: [{ value: '', disabled: true }],  // CRM/CRO, readonly
          nome: ['', [Validators.required, Validators.minLength(3)]],
          rg: [''],
          registroConselho: ['', [Validators.required]],
          especialidade: ['', [Validators.required]],
          telefone: [''],
          email: ['', [Validators.required, Validators.email]],
          dataNascimento: ['', [Validators.required]],
          sexo: ['', [Validators.required]],
          formacao: [''],
          instituicao: [''],
          tempoConsultaMinutos: ['', [Validators.required]],
          valorConsulta: [''],
          status: [{ value: '', disabled: true }],  // readonly
          // Endereço
          nacionalidade: [''],
          uf: ['', Validators.required],
          municipio: ['', Validators.required],
          bairro: ['', Validators.required],
          cep: ['', Validators.required],
          rua: ['', Validators.required],
          numero: ['', Validators.required],
          complemento: [''],
        });
        break;

      case 'Secretária':
        this.formulario = this.fb.group({
          codigo: [{ value: '', disabled: true }],
          nome: ['', [Validators.required, Validators.minLength(3)]],
          email: ['', [Validators.required, Validators.email]]

        });
        break;

      case 'Administrador':
        this.formulario = this.fb.group({
          id: [{ value: '', disabled: true }],
          nome: ['', [Validators.required, Validators.minLength(3)]],
          email: ['', [Validators.required, Validators.email]]
        });
        break;
    }
  }

  private carregarDados(): void {
    console.log(this.data);
    this.isLoading = true;
    const codigo = this.data.usuario.codigo;

    // Mapeamento de serviços por categoria
    const servicosMap: Record<string, Observable<any>> = {
      'Paciente': this.pacienteApiService.buscarrPacientebyOrg(codigo),
      'Clinico': this.profissionalApiService.buscarClinicoIdByOrg(codigo),
      'Secretária': this.secretariaApiService.buscarSecretariaIdByOrg(codigo),
      'Administrador': this.administradorApiService.buscarrAdminByOrg(codigo)
    };

    const servico = servicosMap[this.categoria];

    if (!servico) {
      console.error('Categoria não reconhecida:', this.categoria);
      this.isLoading = false;
      return;
    }

    servico
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dados) => this.processarDadosCarregados(dados),
        error: (error) => this.handleErroCarregamento(error)
      });
  }




  private processarDadosCarregados(dados: any): void {
    this.dadosOriginais = { ...dados };

    let dadosFormulario: any = {};

    switch (this.categoria) {
      case 'Clinico':
        dadosFormulario = this.mapearDadosClinico(dados);
        break;

      case 'Paciente':
        dadosFormulario = this.mapearDadosPaciente(dados);
        break;

      case 'Secretária':
      case 'Administrador':
        dadosFormulario = dados;
        break;

      default:
        dadosFormulario = dados;
    }

    this.formulario.patchValue(dadosFormulario);
    this.isLoading = false;
  }

  private mapearDadosClinico(profissional: any): any {
    const tipoProfissional = profissional.tipoProfissional || 'MEDICO';
    this.tipoProfissionalSelecionado = tipoProfissional;

    return {
      codigo: profissional.id,
      tipoProfissional: tipoProfissional,
      conselho: profissional.conselho,       // CRM / CRO
      nome: profissional.nome,
      cpf: profissional.cpf,
      rg: profissional.rg,
      registroConselho: profissional.registroConselho,
      telefone: profissional.telefone,
      email: profissional.email,
      sexo: profissional.sexo,
      dataNascimento: profissional.dataNascimento,
      especialidade: this.extrairPrimeiraEspecialidade(profissional.especialidades),
      formacao: profissional.formacao,
      instituicao: profissional.instituicao,
      tempoConsultaMinutos: profissional.tempoConsultaMinutos,
      valorConsulta: profissional.valorConsulta,
      status: profissional.status,
      nacionalidade: profissional.endereco?.nacionalidade ?? '',
      uf: profissional.endereco?.uf ?? '',
      municipio: profissional.endereco?.municipio ?? '',
      bairro: profissional.endereco?.bairro ?? '',
      cep: profissional.endereco?.cep ?? '',
      rua: profissional.endereco?.rua ?? '',
      numero: profissional.endereco?.numero ?? null,
      complemento: profissional.endereco?.complemento ?? '',
    };
  }

  private mapearDadosPaciente(paciente: any): any {
    // dataNascimento vem como "10/05/1985" (dd/MM/yyyy) → converter para yyyy-MM-dd
    let dataNascimentoFormatada = '';
    const dataRaw = paciente.dataNascimento || paciente.dataNacimento; // cobre typo do backend
    if (dataRaw) {
      if (dataRaw.includes('/')) {
        const [dia, mes, ano] = dataRaw.split('/');
        dataNascimentoFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      } else {
        dataNascimentoFormatada = dataRaw; // já está em yyyy-MM-dd
      }
    }

    // sexo vem como "Masculino"/"Feminino" — normalizar para MAIÚSCULO
    const sexoNormalizado = paciente.sexo
      ? paciente.sexo.toUpperCase()     // "Masculino" → "MASCULINO"
      : '';

    return {
      codigo: paciente.codigo,
      nome: paciente.nome,
      cpf: paciente.cpf,
      sexo: sexoNormalizado,
      dataNascimento: dataNascimentoFormatada,
      rg: paciente.rg || '',
      email: paciente.email,
      telefone: paciente.telefone || '',
      codigoEndereco: paciente.endereco?.codigo || '',
      nacionalidade: paciente.endereco?.nacionalidade || '',
      uf: paciente.endereco?.uf || '',
      municipio: paciente.endereco?.municipio || '',
      bairro: paciente.endereco?.bairro || '',
      cep: paciente.endereco?.cep || '',
      rua: paciente.endereco?.rua || '',
      numero: paciente.endereco?.numero || '',
      complemento: paciente.endereco?.complemento || '',
    };
  }



  salvar(): void {
    if (this.formulario.invalid) {
      this.marcarCamposComoTocados();
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Preencha todos os campos obrigatórios corretamente.',
        showCloseButton: true
      });
      return;
    }

    this.isLoading = true;
    const codigo = this.data.usuario.codigo;
    const formValues = this.formulario.getRawValue();
    let dadosAtualizados: any = {};


    // Prepara dados de acordo com a categoria
    if (this.categoria === 'Clinico') {
      dadosAtualizados = this.prepararDadosClinico(formValues);

    } else if (this.categoria === 'Paciente') {
      dadosAtualizados = this.prepararDadosPaciente(formValues);

    } else if (this.categoria === 'Secretária') {
      dadosAtualizados = this.prepararDadosSecretaria(formValues, codigo);

    } else if (this.categoria === 'Administrador') {
      dadosAtualizados = this.prepararDadosAdministrador(formValues, codigo);
    }


    // Envia dados para o backend
    this.enviarDadosParaBackend(codigo, dadosAtualizados);
  }

  private prepararDadosClinico(formValues: any): any {
    return {
      nome: formValues.nome,
      cpf: formValues.cpf,
      rg: formValues.rg || null,
      registroConselho: formValues.registroConselho,
      telefone: formValues.telefone,
      email: formValues.email,
      sexo: formValues.sexo || this.dadosOriginais.sexo || null,
      dataNascimento: formValues.dataNascimento || this.dadosOriginais.dataNascimento || null,
      formacao: formValues.formacao || null,
      instituicao: formValues.instituicao || null,
      tempoConsultaMinutos: formValues.tempoConsultaMinutos || 30,
      valorConsulta: formValues.valorConsulta || 0,
      tipoProfissional: formValues.tipoProfissional || 'MEDICO',
      especialidade: formValues.especialidade,
      endereco: this.prepararEndereco(formValues)
    };
  }





  carregarEspecialidades() {
    this.isLoadingEspecialidades = true;
    this.especialidadeService.carregarEspecialidades().subscribe({
      next: (especialidades) => {
        this.especialidades = especialidades;
        this.isLoadingEspecialidades = false;
      },
      error: (error) => {
        console.error('Erro ao carregar especialidades:', error);
        this.isLoadingEspecialidades = false;
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível carregar as especialidades. Tente novamente.',
        });
      }
    });
  }




  onTipoProfissionalChange() {
    this.tipoProfissionalSelecionado = this.formulario.get('tipoProfissional')?.value || 'MEDICO';
    this.formulario.patchValue({ especialidade: '' });
    this.carregarEspecialidades();
  }

  abrirModalNovaEspecialidade() {
    this.mostrarModalNovaEspecialidade = true;
    this.novaEspecialidadeNome = '';
  }

  fecharModalNovaEspecialidade() {
    this.mostrarModalNovaEspecialidade = false;
    this.novaEspecialidadeNome = '';
  }

  criarNovaEspecialidade() {
    if (!this.novaEspecialidadeNome || this.novaEspecialidadeNome.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Campo obrigatório',
        text: 'Por favor, informe o nome da especialidade.',
      });
      return;
    }

    this.isLoading = true;
    const tipoProfissionalId = this.tipoProfissionalSelecionado === 'DENTISTA' ? 2 : 1;

    const request = {
      tipoProfissionalId: tipoProfissionalId,
      nome: this.novaEspecialidadeNome.trim(),
      codigo: this.novaEspecialidadeNome.trim().toUpperCase().replace(/\s+/g, '_')
    };

    this.especialidadeService.criar(request).pipe(takeUntil(this.destroy$)).subscribe({
      next: (novaEspecialidade) => {
        this.isLoading = false;
        this.especialidades.push(novaEspecialidade);
        this.formulario.patchValue({ especialidade: novaEspecialidade.nome });
        this.fecharModalNovaEspecialidade();

        Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Especialidade criada com sucesso.',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erro ao criar especialidade:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível criar a especialidade. Verifique se já existe uma especialidade com este nome.',
        });
      }
    });
  }

  private prepararEndereco(formValues: any): any {
    return {
      codigo: this.dadosOriginais.endereco?.codigo || null,
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

  /**
   * Prepara os dados do paciente para envio ao backend
   */
  private prepararDadosPaciente(formValues: any): any {
    return {
      nome: formValues.nome,
      sexo: formValues.sexo,                          // MASCULINO / FEMININO
      dataNascimento: formValues.dataNascimento || null,        // yyyy-MM-dd
      cpf: formValues.cpf,
      rg: formValues.rg || null,
      email: formValues.email,
      telefone: formValues.telefone || null,
      nacionalidade: formValues.nacionalidade || null,
      uf: formValues.uf,
      municipio: formValues.municipio,
      bairro: formValues.bairro,
      cep: formValues.cep,
      rua: formValues.rua,
      numero: formValues.numero ? parseInt(formValues.numero.toString(), 10) : null,
      complemento: formValues.complemento || null,
    };
  }

  private prepararDadosSecretaria(formValues: any, codigo: number): any {
    return { codigo: codigo, nome: formValues.nome, email: formValues.email };
  }

  private prepararDadosAdministrador(formValues: any, codigo: number): any {
    return { codigo: codigo, nome: formValues.nome, email: formValues.email };
  }

  /**
   * Envia os dados atualizados para o backend de acordo com a categoria
   */
  private enviarDadosParaBackend(codigo: number, dadosAtualizados: any): void {
    console.log('Dados a serem enviados para o backend:', dadosAtualizados);
    const servicosMap: Record<string, Observable<any>> = {
      'Paciente': this.pacienteApiService.atualizarPacientebyOrg(codigo, dadosAtualizados),
      'Clinico': this.profissionalApiService.atualizarClinicoIdByOrg(codigo, dadosAtualizados),
      'Secretária': this.secretariaApiService.atualizarSecretariaIdByOrg(codigo, dadosAtualizados),
      'Administrador': this.administradorApiService.atualizarAdmByOrg(codigo, dadosAtualizados)
    };

    const servico = servicosMap[this.categoria];

    if (!servico) {
      console.error('Categoria não reconhecida:', this.categoria);
      this.isLoading = false;
      return;
    }

    servico
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleSucessoAtualizacao(),
        error: (error) => this.handleErroAtualizacao(error)
      });
  }



  private handleSucessoAtualizacao(): void {
    this.isLoading = false;
    Swal.fire({
      icon: 'success',
      title: 'Sucesso!',
      text: 'Dados atualizados com sucesso.',
      timer: 2000,
      showConfirmButton: false
    }).then(() => {
      this.dialogRef.close(true);
    });
  }

  private handleErroAtualizacao(error: any): void {
    console.error('Erro ao atualizar dados:', error);
    this.isLoading = false;
    Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: 'Não foi possível atualizar os dados. Tente novamente.',
      showCloseButton: true
    });
  }

  private marcarCamposComoTocados(): void {
    Object.keys(this.formulario.controls).forEach(key => {
      this.formulario.get(key)?.markAsTouched();
    });
  }

  getCampoErro(campo: string): string {
    const control = this.formulario.get(campo);
    if (control?.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (control?.hasError('email')) {
      return 'E-mail inválido';
    }
    if (control?.hasError('minlength')) {
      return 'Mínimo de 3 caracteres';
    }
    if (control?.hasError('pattern')) {
      return 'Formato inválido';
    }
    return '';
  }

  getIconeCategoria(): string {
    const icones: Record<string, string> = {
      'Paciente': 'fa-user-injured',
      'Clinico': 'fa-user-doctor',
      'Secretária': 'fa-user-tie',
      'Administrador': 'fa-user-shield'
    };
    return icones[this.categoria] || 'fa-user';
  }

  getCorCategoria(): string {
    const cores: Record<string, string> = {
      'Paciente': '#10b981',
      'Cliinico': '#3b82f6',
      'Secretária': '#8b5cf6',
      'Administrador': '#ef4444'
    };
    return cores[this.categoria] || '#6b7280';
  }

  fechar(): void {
    this.dialogRef.close(false);
  }



  /**
   * Converte data do formato brasileiro (dd/MM/yyyy) para ISO (yyyy-MM-dd)
   */
  private converterDataParaISO(data: string): string {
    if (!data) return '';

    // Se já estiver no formato ISO, retorna como está
    if (data.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return data;
    }

    // Converte dd/MM/yyyy para yyyy-MM-dd
    const partes = data.split('/');
    if (partes.length === 3) {
      const [dia, mes, ano] = partes;
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    return data;
  }



  private handleErroCarregamento(error: any): void {
    console.error('Erro ao carregar dados:', error);
    this.isLoading = false;
    Swal.fire({
      icon: 'error',
      title: 'Erro',
      text: 'Não foi possível carregar os dados do usuário.',
      showCloseButton: true
    });
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.formulario.patchValue(this.dadosOriginais);
    }
  }


  private extrairPrimeiraEspecialidade(especialidades?: Array<{ id: number; nome: string }>): string {
    return especialidades && especialidades.length > 0 ? especialidades[0].nome : '';
  }
}
