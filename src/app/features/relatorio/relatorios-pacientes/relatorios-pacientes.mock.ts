import { PacienteAtendido } from 'src/app/util/variados/interfaces/relatorio/relatorio-paciente';

/**
 * Massa de dados para desenvolvimento e testes da tela de relatorios por paciente.
 *
 * Cobre os cenarios relevantes da tela:
 * - consulta com prontuario medico completo (registro, prescricao, exames);
 * - consulta odontologica com planejamento terapeutico;
 * - consulta com apenas questionario de saude, sem prontuario preenchido;
 * - consulta paga, que gera comprovante de pagamento;
 * - consulta agendada, sem documentos.
 */
export const PACIENTES_ATENDIDOS_MOCK: PacienteAtendido[] = [
  {
    id: 1,
    nome: 'Maria Silva Santos',
    cpf: '12345678901',
    telefone: '11987654321',
    email: 'maria.silva@email.com',
    dataNascimento: '1985-03-15',
    sexo: 'Feminino',
    profissionalId: 10,
    profissionalNome: 'Dra. Helena Martins',
    ultimoAtendimento: '2026-08-12T14:30:00',
    totalConsultas: 2,
    totalDocumentos: 5,
    consultas: [
      {
        id: 101,
        dataHora: '2026-08-12T14:30:00',
        status: 'REALIZADA',
        especialidadeNome: 'Cardiologia',
        profissionalId: 10,
        profissionalNome: 'Dra. Helena Martins',
        tipoProfissionalNome: 'MEDICO',
        diagnostico: 'Hipertensao arterial estagio 1, em acompanhamento.',
        documentos: [
          {
            id: 5001,
            tipo: 'REGISTRO_CONSULTA',
            titulo: 'Registro da consulta',
            descricao: 'Hipertensao arterial estagio 1, em acompanhamento.',
            emitidoEm: '2026-08-12T15:10:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 5001,
            tipo: 'PRESCRICAO',
            titulo: 'Receituario',
            descricao: 'Losartana 50mg, 1 comprimido ao dia por 30 dias.',
            emitidoEm: '2026-08-12T15:12:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 5001,
            tipo: 'EXAMES',
            titulo: 'Solicitacao de exames',
            descricao: 'Hemograma completo, perfil lipidico e eletrocardiograma.',
            emitidoEm: '2026-08-12T15:14:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 17,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-12T14:20:00',
            assinado: true,
            consultaId: 101
          }
        ]
      },
      {
        id: 102,
        dataHora: '2026-06-04T09:00:00',
        status: 'PAGO',
        especialidadeNome: 'Cardiologia',
        profissionalId: 10,
        profissionalNome: 'Dra. Helena Martins',
        tipoProfissionalNome: 'MEDICO',
        diagnostico: null,
        documentos: [
          {
            id: 102,
            tipo: 'COMPROVANTE_PAGAMENTO',
            titulo: 'Comprovante de pagamento',
            descricao: 'Pagamento de R$ 350,00 via Pix.',
            emitidoEm: '2026-06-04T09:45:00',
            assinado: false,
            consultaId: 102
          }
        ]
      }
    ]
  },
  {
    id: 2,
    nome: 'Joao Pereira Oliveira',
    cpf: '23456789012',
    telefone: '11976543210',
    email: 'joao.pereira@email.com',
    dataNascimento: '1990-07-22',
    sexo: 'Masculino',
    profissionalId: 20,
    profissionalNome: 'Dr. Rafael Nunes',
    ultimoAtendimento: '2026-08-10T10:15:00',
    totalConsultas: 1,
    totalDocumentos: 4,
    consultas: [
      {
        id: 201,
        dataHora: '2026-08-10T10:15:00',
        status: 'REALIZADA',
        especialidadeNome: 'Odontologia Restauradora',
        profissionalId: 20,
        profissionalNome: 'Dr. Rafael Nunes',
        tipoProfissionalNome: 'DENTISTA',
        diagnostico: 'Carie oclusal no dente 36 e gengivite localizada.',
        documentos: [
          {
            id: 7001,
            tipo: 'REGISTRO_CONSULTA',
            titulo: 'Registro da consulta',
            descricao: 'Carie oclusal no dente 36 e gengivite localizada.',
            emitidoEm: '2026-08-10T11:00:00',
            assinado: false,
            consultaId: 201
          },
          {
            id: 7001,
            tipo: 'PRESCRICAO',
            titulo: 'Receituario odontologico',
            descricao: 'Amoxicilina 500mg de 8 em 8 horas por 7 dias.',
            emitidoEm: '2026-08-10T11:05:00',
            assinado: false,
            consultaId: 201
          },
          {
            id: 9001,
            tipo: 'PLANEJAMENTO',
            titulo: 'Planejamento terapeutico',
            descricao: '3 procedimentos planejados',
            emitidoEm: '2026-08-10T11:10:00',
            assinado: true,
            consultaId: 201
          },
          {
            id: 18,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-10T10:05:00',
            assinado: true,
            consultaId: 201
          }
        ]
      }
    ]
  },
  {
    id: 3,
    nome: 'Ana Costa Ferreira',
    cpf: '34567890123',
    telefone: '21987654322',
    email: 'ana.costa@email.com',
    dataNascimento: '1988-11-08',
    sexo: 'Feminino',
    profissionalId: 20,
    profissionalNome: 'Dr. Rafael Nunes',
    ultimoAtendimento: '2026-08-13T10:43:00',
    totalConsultas: 1,
    totalDocumentos: 1,
    consultas: [
      {
        id: 6,
        dataHora: '2026-08-13T10:43:00',
        status: 'REALIZADA',
        especialidadeNome: 'Odontologia Geral',
        profissionalId: 20,
        profissionalNome: 'Dr. Rafael Nunes',
        tipoProfissionalNome: 'DENTISTA',
        diagnostico: null,
        documentos: [
          {
            id: 17,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-13T10:44:35',
            assinado: true,
            consultaId: 6
          }
        ]
      }
    ]
  },
  {
    id: 4,
    nome: 'Carlos Alberto Souza',
    cpf: '45678901234',
    telefone: '31976543211',
    email: 'carlos.souza@email.com',
    dataNascimento: '1975-05-30',
    sexo: 'Masculino',
    profissionalId: 11,
    profissionalNome: 'Dr. Bruno Almeida',
    ultimoAtendimento: '2026-08-05T16:00:00',
    totalConsultas: 2,
    totalDocumentos: 2,
    consultas: [
      {
        id: 401,
        dataHora: '2026-08-20T08:30:00',
        status: 'AGENDADA',
        especialidadeNome: 'Ortopedia',
        profissionalId: 11,
        profissionalNome: 'Dr. Bruno Almeida',
        tipoProfissionalNome: 'MEDICO',
        diagnostico: null,
        documentos: []
      },
      {
        id: 402,
        dataHora: '2026-08-05T16:00:00',
        status: 'REALIZADA',
        especialidadeNome: 'Ortopedia',
        profissionalId: 11,
        profissionalNome: 'Dr. Bruno Almeida',
        tipoProfissionalNome: 'MEDICO',
        diagnostico: 'Tendinite no ombro direito.',
        documentos: [
          {
            id: 8001,
            tipo: 'REGISTRO_CONSULTA',
            titulo: 'Registro da consulta',
            descricao: 'Tendinite no ombro direito.',
            emitidoEm: '2026-08-05T16:40:00',
            assinado: false,
            consultaId: 402
          },
          {
            id: 8001,
            tipo: 'ATESTADO',
            titulo: 'Atestado medico',
            descricao: 'Afastamento de 3 dias por tendinite.',
            emitidoEm: '2026-08-05T16:45:00',
            assinado: false,
            consultaId: 402
          }
        ]
      }
    ]
  },
  {
    id: 1,
    nome: 'Maria Silva Santos',
    cpf: '12345678901',
    telefone: '11987654321',
    email: 'maria.silva@email.com',
    dataNascimento: '1985-03-15',
    sexo: 'Feminino',
    profissionalId: 10,
    profissionalNome: 'Dra. Helena Martins',
    ultimoAtendimento: '2026-08-12T14:30:00',
    totalConsultas: 2,
    totalDocumentos: 5,
    consultas: [
      {
        id: 101,
        dataHora: '2026-08-12T14:30:00',
        status: 'REALIZADA',
        especialidadeNome: 'Cardiologia',
        profissionalId: 10,
        profissionalNome: 'Dra. Helena Martins',
        tipoProfissionalNome: 'MEDICO',
        diagnostico: 'Hipertensao arterial estagio 1, em acompanhamento.',
        documentos: [
          {
            id: 5001,
            tipo: 'REGISTRO_CONSULTA',
            titulo: 'Registro da consulta',
            descricao: 'Hipertensao arterial estagio 1, em acompanhamento.',
            emitidoEm: '2026-08-12T15:10:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 5001,
            tipo: 'PRESCRICAO',
            titulo: 'Receituario',
            descricao: 'Losartana 50mg, 1 comprimido ao dia por 30 dias.',
            emitidoEm: '2026-08-12T15:12:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 5001,
            tipo: 'EXAMES',
            titulo: 'Solicitacao de exames',
            descricao: 'Hemograma completo, perfil lipidico e eletrocardiograma.',
            emitidoEm: '2026-08-12T15:14:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 17,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-12T14:20:00',
            assinado: true,
            consultaId: 101
          }
        ]
      },
      {
        id: 102,
        dataHora: '2026-06-04T09:00:00',
        status: 'PAGO',
        especialidadeNome: 'Cardiologia',
        profissionalId: 10,
        profissionalNome: 'Dra. Helena Martins',
        tipoProfissionalNome: 'MEDICO',
        diagnostico: null,
        documentos: [
          {
            id: 102,
            tipo: 'COMPROVANTE_PAGAMENTO',
            titulo: 'Comprovante de pagamento',
            descricao: 'Pagamento de R$ 350,00 via Pix.',
            emitidoEm: '2026-06-04T09:45:00',
            assinado: false,
            consultaId: 102
          }
        ]
      }
    ]
  },
  {
    id: 2,
    nome: 'Joao Pereira Oliveira',
    cpf: '23456789012',
    telefone: '11976543210',
    email: 'joao.pereira@email.com',
    dataNascimento: '1990-07-22',
    sexo: 'Masculino',
    profissionalId: 20,
    profissionalNome: 'Dr. Rafael Nunes',
    ultimoAtendimento: '2026-08-10T10:15:00',
    totalConsultas: 1,
    totalDocumentos: 4,
    consultas: [
      {
        id: 201,
        dataHora: '2026-08-10T10:15:00',
        status: 'REALIZADA',
        especialidadeNome: 'Odontologia Restauradora',
        profissionalId: 20,
        profissionalNome: 'Dr. Rafael Nunes',
        tipoProfissionalNome: 'DENTISTA',
        diagnostico: 'Carie oclusal no dente 36 e gengivite localizada.',
        documentos: [
          {
            id: 7001,
            tipo: 'REGISTRO_CONSULTA',
            titulo: 'Registro da consulta',
            descricao: 'Carie oclusal no dente 36 e gengivite localizada.',
            emitidoEm: '2026-08-10T11:00:00',
            assinado: false,
            consultaId: 201
          },
          {
            id: 7001,
            tipo: 'PRESCRICAO',
            titulo: 'Receituario odontologico',
            descricao: 'Amoxicilina 500mg de 8 em 8 horas por 7 dias.',
            emitidoEm: '2026-08-10T11:05:00',
            assinado: false,
            consultaId: 201
          },
          {
            id: 9001,
            tipo: 'PLANEJAMENTO',
            titulo: 'Planejamento terapeutico',
            descricao: '3 procedimentos planejados',
            emitidoEm: '2026-08-10T11:10:00',
            assinado: true,
            consultaId: 201
          },
          {
            id: 18,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-10T10:05:00',
            assinado: true,
            consultaId: 201
          }
        ]
      }
    ]
  },
  {
    id: 3,
    nome: 'Ana Costa Ferreira',
    cpf: '34567890123',
    telefone: '21987654322',
    email: 'ana.costa@email.com',
    dataNascimento: '1988-11-08',
    sexo: 'Feminino',
    profissionalId: 20,
    profissionalNome: 'Dr. Rafael Nunes',
    ultimoAtendimento: '2026-08-13T10:43:00',
    totalConsultas: 1,
    totalDocumentos: 1,
    consultas: [
      {
        id: 6,
        dataHora: '2026-08-13T10:43:00',
        status: 'REALIZADA',
        especialidadeNome: 'Odontologia Geral',
        profissionalId: 20,
        profissionalNome: 'Dr. Rafael Nunes',
        tipoProfissionalNome: 'DENTISTA',
        diagnostico: null,
        documentos: [
          {
            id: 17,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-13T10:44:35',
            assinado: true,
            consultaId: 6
          }
        ]
      }
    ]
  },
  {
    id: 1,
    nome: 'Maria Silva Santos',
    cpf: '12345678901',
    telefone: '11987654321',
    email: 'maria.silva@email.com',
    dataNascimento: '1985-03-15',
    sexo: 'Feminino',
    profissionalId: 10,
    profissionalNome: 'Dra. Helena Martins',
    ultimoAtendimento: '2026-08-12T14:30:00',
    totalConsultas: 2,
    totalDocumentos: 5,
    consultas: [
      {
        id: 101,
        dataHora: '2026-08-12T14:30:00',
        status: 'REALIZADA',
        especialidadeNome: 'Cardiologia',
        profissionalId: 10,
        profissionalNome: 'Dra. Helena Martins',
        tipoProfissionalNome: 'MEDICO',
        diagnostico: 'Hipertensao arterial estagio 1, em acompanhamento.',
        documentos: [
          {
            id: 5001,
            tipo: 'REGISTRO_CONSULTA',
            titulo: 'Registro da consulta',
            descricao: 'Hipertensao arterial estagio 1, em acompanhamento.',
            emitidoEm: '2026-08-12T15:10:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 5001,
            tipo: 'PRESCRICAO',
            titulo: 'Receituario',
            descricao: 'Losartana 50mg, 1 comprimido ao dia por 30 dias.',
            emitidoEm: '2026-08-12T15:12:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 5001,
            tipo: 'EXAMES',
            titulo: 'Solicitacao de exames',
            descricao: 'Hemograma completo, perfil lipidico e eletrocardiograma.',
            emitidoEm: '2026-08-12T15:14:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 17,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-12T14:20:00',
            assinado: true,
            consultaId: 101
          }
        ]
      },
      {
        id: 102,
        dataHora: '2026-06-04T09:00:00',
        status: 'PAGO',
        especialidadeNome: 'Cardiologia',
        profissionalId: 10,
        profissionalNome: 'Dra. Helena Martins',
        tipoProfissionalNome: 'MEDICO',
        diagnostico: null,
        documentos: [
          {
            id: 102,
            tipo: 'COMPROVANTE_PAGAMENTO',
            titulo: 'Comprovante de pagamento',
            descricao: 'Pagamento de R$ 350,00 via Pix.',
            emitidoEm: '2026-06-04T09:45:00',
            assinado: false,
            consultaId: 102
          }
        ]
      }
    ]
  },
  {
    id: 2,
    nome: 'Joao Pereira Oliveira',
    cpf: '23456789012',
    telefone: '11976543210',
    email: 'joao.pereira@email.com',
    dataNascimento: '1990-07-22',
    sexo: 'Masculino',
    profissionalId: 20,
    profissionalNome: 'Dr. Rafael Nunes',
    ultimoAtendimento: '2026-08-10T10:15:00',
    totalConsultas: 1,
    totalDocumentos: 4,
    consultas: [
      {
        id: 201,
        dataHora: '2026-08-10T10:15:00',
        status: 'REALIZADA',
        especialidadeNome: 'Odontologia Restauradora',
        profissionalId: 20,
        profissionalNome: 'Dr. Rafael Nunes',
        tipoProfissionalNome: 'DENTISTA',
        diagnostico: 'Carie oclusal no dente 36 e gengivite localizada.',
        documentos: [
          {
            id: 7001,
            tipo: 'REGISTRO_CONSULTA',
            titulo: 'Registro da consulta',
            descricao: 'Carie oclusal no dente 36 e gengivite localizada.',
            emitidoEm: '2026-08-10T11:00:00',
            assinado: false,
            consultaId: 201
          },
          {
            id: 7001,
            tipo: 'PRESCRICAO',
            titulo: 'Receituario odontologico',
            descricao: 'Amoxicilina 500mg de 8 em 8 horas por 7 dias.',
            emitidoEm: '2026-08-10T11:05:00',
            assinado: false,
            consultaId: 201
          },
          {
            id: 9001,
            tipo: 'PLANEJAMENTO',
            titulo: 'Planejamento terapeutico',
            descricao: '3 procedimentos planejados',
            emitidoEm: '2026-08-10T11:10:00',
            assinado: true,
            consultaId: 201
          },
          {
            id: 18,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-10T10:05:00',
            assinado: true,
            consultaId: 201
          }
        ]
      }
    ]
  },
  {
    id: 3,
    nome: 'Ana Costa Ferreira',
    cpf: '34567890123',
    telefone: '21987654322',
    email: 'ana.costa@email.com',
    dataNascimento: '1988-11-08',
    sexo: 'Feminino',
    profissionalId: 20,
    profissionalNome: 'Dr. Rafael Nunes',
    ultimoAtendimento: '2026-08-13T10:43:00',
    totalConsultas: 1,
    totalDocumentos: 1,
    consultas: [
      {
        id: 6,
        dataHora: '2026-08-13T10:43:00',
        status: 'REALIZADA',
        especialidadeNome: 'Odontologia Geral',
        profissionalId: 20,
        profissionalNome: 'Dr. Rafael Nunes',
        tipoProfissionalNome: 'DENTISTA',
        diagnostico: null,
        documentos: [
          {
            id: 17,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-13T10:44:35',
            assinado: true,
            consultaId: 6
          }
        ]
      }
    ]
  },
  {
    id: 1,
    nome: 'Maria Silva Santos',
    cpf: '12345678901',
    telefone: '11987654321',
    email: 'maria.silva@email.com',
    dataNascimento: '1985-03-15',
    sexo: 'Feminino',
    profissionalId: 10,
    profissionalNome: 'Dra. Helena Martins',
    ultimoAtendimento: '2026-08-12T14:30:00',
    totalConsultas: 2,
    totalDocumentos: 5,
    consultas: [
      {
        id: 101,
        dataHora: '2026-08-12T14:30:00',
        status: 'REALIZADA',
        especialidadeNome: 'Cardiologia',
        profissionalId: 10,
        profissionalNome: 'Dra. Helena Martins',
        tipoProfissionalNome: 'MEDICO',
        diagnostico: 'Hipertensao arterial estagio 1, em acompanhamento.',
        documentos: [
          {
            id: 5001,
            tipo: 'REGISTRO_CONSULTA',
            titulo: 'Registro da consulta',
            descricao: 'Hipertensao arterial estagio 1, em acompanhamento.',
            emitidoEm: '2026-08-12T15:10:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 5001,
            tipo: 'PRESCRICAO',
            titulo: 'Receituario',
            descricao: 'Losartana 50mg, 1 comprimido ao dia por 30 dias.',
            emitidoEm: '2026-08-12T15:12:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 5001,
            tipo: 'EXAMES',
            titulo: 'Solicitacao de exames',
            descricao: 'Hemograma completo, perfil lipidico e eletrocardiograma.',
            emitidoEm: '2026-08-12T15:14:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 17,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-12T14:20:00',
            assinado: true,
            consultaId: 101
          }
        ]
      },
      {
        id: 102,
        dataHora: '2026-06-04T09:00:00',
        status: 'PAGO',
        especialidadeNome: 'Cardiologia',
        profissionalId: 10,
        profissionalNome: 'Dra. Helena Martins',
        tipoProfissionalNome: 'MEDICO',
        diagnostico: null,
        documentos: [
          {
            id: 102,
            tipo: 'COMPROVANTE_PAGAMENTO',
            titulo: 'Comprovante de pagamento',
            descricao: 'Pagamento de R$ 350,00 via Pix.',
            emitidoEm: '2026-06-04T09:45:00',
            assinado: false,
            consultaId: 102
          }
        ]
      }
    ]
  },
  {
    id: 2,
    nome: 'Joao Pereira Oliveira',
    cpf: '23456789012',
    telefone: '11976543210',
    email: 'joao.pereira@email.com',
    dataNascimento: '1990-07-22',
    sexo: 'Masculino',
    profissionalId: 20,
    profissionalNome: 'Dr. Rafael Nunes',
    ultimoAtendimento: '2026-08-10T10:15:00',
    totalConsultas: 1,
    totalDocumentos: 4,
    consultas: [
      {
        id: 201,
        dataHora: '2026-08-10T10:15:00',
        status: 'REALIZADA',
        especialidadeNome: 'Odontologia Restauradora',
        profissionalId: 20,
        profissionalNome: 'Dr. Rafael Nunes',
        tipoProfissionalNome: 'DENTISTA',
        diagnostico: 'Carie oclusal no dente 36 e gengivite localizada.',
        documentos: [
          {
            id: 7001,
            tipo: 'REGISTRO_CONSULTA',
            titulo: 'Registro da consulta',
            descricao: 'Carie oclusal no dente 36 e gengivite localizada.',
            emitidoEm: '2026-08-10T11:00:00',
            assinado: false,
            consultaId: 201
          },
          {
            id: 7001,
            tipo: 'PRESCRICAO',
            titulo: 'Receituario odontologico',
            descricao: 'Amoxicilina 500mg de 8 em 8 horas por 7 dias.',
            emitidoEm: '2026-08-10T11:05:00',
            assinado: false,
            consultaId: 201
          },
          {
            id: 9001,
            tipo: 'PLANEJAMENTO',
            titulo: 'Planejamento terapeutico',
            descricao: '3 procedimentos planejados',
            emitidoEm: '2026-08-10T11:10:00',
            assinado: true,
            consultaId: 201
          },
          {
            id: 18,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-10T10:05:00',
            assinado: true,
            consultaId: 201
          }
        ]
      }
    ]
  },
  {
    id: 3,
    nome: 'Ana Costa Ferreira',
    cpf: '34567890123',
    telefone: '21987654322',
    email: 'ana.costa@email.com',
    dataNascimento: '1988-11-08',
    sexo: 'Feminino',
    profissionalId: 20,
    profissionalNome: 'Dr. Rafael Nunes',
    ultimoAtendimento: '2026-08-13T10:43:00',
    totalConsultas: 1,
    totalDocumentos: 1,
    consultas: [
      {
        id: 6,
        dataHora: '2026-08-13T10:43:00',
        status: 'REALIZADA',
        especialidadeNome: 'Odontologia Geral',
        profissionalId: 20,
        profissionalNome: 'Dr. Rafael Nunes',
        tipoProfissionalNome: 'DENTISTA',
        diagnostico: null,
        documentos: [
          {
            id: 17,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-13T10:44:35',
            assinado: true,
            consultaId: 6
          }
        ]
      }
    ]
  },{

    id: 2,
    nome: 'Joao Pereira Oliveira',
    cpf: '23456789012',
    telefone: '11976543210',
    email: 'joao.pereira@email.com',
    dataNascimento: '1990-07-22',
    sexo: 'Masculino',
    profissionalId: 20,
    profissionalNome: 'Dr. Rafael Nunes',
    ultimoAtendimento: '2026-08-10T10:15:00',
    totalConsultas: 1,
    totalDocumentos: 4,
    consultas: [
      {
        id: 201,
        dataHora: '2026-08-10T10:15:00',
        status: 'REALIZADA',
        especialidadeNome: 'Odontologia Restauradora',
        profissionalId: 20,
        profissionalNome: 'Dr. Rafael Nunes',
        tipoProfissionalNome: 'DENTISTA',
        diagnostico: 'Carie oclusal no dente 36 e gengivite localizada.',
        documentos: [
          {
            id: 7001,
            tipo: 'REGISTRO_CONSULTA',
            titulo: 'Registro da consulta',
            descricao: 'Carie oclusal no dente 36 e gengivite localizada.',
            emitidoEm: '2026-08-10T11:00:00',
            assinado: false,
            consultaId: 201
          },
          {
            id: 7001,
            tipo: 'PRESCRICAO',
            titulo: 'Receituario odontologico',
            descricao: 'Amoxicilina 500mg de 8 em 8 horas por 7 dias.',
            emitidoEm: '2026-08-10T11:05:00',
            assinado: false,
            consultaId: 201
          },
          {
            id: 9001,
            tipo: 'PLANEJAMENTO',
            titulo: 'Planejamento terapeutico',
            descricao: '3 procedimentos planejados',
            emitidoEm: '2026-08-10T11:10:00',
            assinado: true,
            consultaId: 201
          },
          {
            id: 18,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-10T10:05:00',
            assinado: true,
            consultaId: 201
          }
        ]
      }
    ]
  },
  {
    id: 3,
    nome: 'Ana Costa Ferreira',
    cpf: '34567890123',
    telefone: '21987654322',
    email: 'ana.costa@email.com',
    dataNascimento: '1988-11-08',
    sexo: 'Feminino',
    profissionalId: 20,
    profissionalNome: 'Dr. Rafael Nunes',
    ultimoAtendimento: '2026-08-13T10:43:00',
    totalConsultas: 1,
    totalDocumentos: 1,
    consultas: [
      {
        id: 6,
        dataHora: '2026-08-13T10:43:00',
        status: 'REALIZADA',
        especialidadeNome: 'Odontologia Geral',
        profissionalId: 20,
        profissionalNome: 'Dr. Rafael Nunes',
        tipoProfissionalNome: 'DENTISTA',
        diagnostico: null,
        documentos: [
          {
            id: 17,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-13T10:44:35',
            assinado: true,
            consultaId: 6
          }
        ]
      }
    ]
  },
  {
    id: 4,
    nome: 'Carlos Alberto Souza',
    cpf: '45678901234',
    telefone: '31976543211',
    email: 'carlos.souza@email.com',
    dataNascimento: '1975-05-30',
    sexo: 'Masculino',
    profissionalId: 11,
    profissionalNome: 'Dr. Bruno Almeida',
    ultimoAtendimento: '2026-08-05T16:00:00',
    totalConsultas: 2,
    totalDocumentos: 2,
    consultas: [
      {
        id: 401,
        dataHora: '2026-08-20T08:30:00',
        status: 'AGENDADA',
        especialidadeNome: 'Ortopedia',
        profissionalId: 11,
        profissionalNome: 'Dr. Bruno Almeida',
        tipoProfissionalNome: 'MEDICO',
        diagnostico: null,
        documentos: []
      },
      {
        id: 402,
        dataHora: '2026-08-05T16:00:00',
        status: 'REALIZADA',
        especialidadeNome: 'Ortopedia',
        profissionalId: 11,
        profissionalNome: 'Dr. Bruno Almeida',
        tipoProfissionalNome: 'MEDICO',
        diagnostico: 'Tendinite no ombro direito.',
        documentos: [
          {
            id: 8001,
            tipo: 'REGISTRO_CONSULTA',
            titulo: 'Registro da consulta',
            descricao: 'Tendinite no ombro direito.',
            emitidoEm: '2026-08-05T16:40:00',
            assinado: false,
            consultaId: 402
          },
          {
            id: 8001,
            tipo: 'ATESTADO',
            titulo: 'Atestado medico',
            descricao: 'Afastamento de 3 dias por tendinite.',
            emitidoEm: '2026-08-05T16:45:00',
            assinado: false,
            consultaId: 402
          }
        ]
      }
    ]
  },
  {
    id: 1,
    nome: 'Maria Silva Santos',
    cpf: '12345678901',
    telefone: '11987654321',
    email: 'maria.silva@email.com',
    dataNascimento: '1985-03-15',
    sexo: 'Feminino',
    profissionalId: 10,
    profissionalNome: 'Dra. Helena Martins',
    ultimoAtendimento: '2026-08-12T14:30:00',
    totalConsultas: 2,
    totalDocumentos: 5,
    consultas: [
      {
        id: 101,
        dataHora: '2026-08-12T14:30:00',
        status: 'REALIZADA',
        especialidadeNome: 'Cardiologia',
        profissionalId: 10,
        profissionalNome: 'Dra. Helena Martins',
        tipoProfissionalNome: 'MEDICO',
        diagnostico: 'Hipertensao arterial estagio 1, em acompanhamento.',
        documentos: [
          {
            id: 5001,
            tipo: 'REGISTRO_CONSULTA',
            titulo: 'Registro da consulta',
            descricao: 'Hipertensao arterial estagio 1, em acompanhamento.',
            emitidoEm: '2026-08-12T15:10:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 5001,
            tipo: 'PRESCRICAO',
            titulo: 'Receituario',
            descricao: 'Losartana 50mg, 1 comprimido ao dia por 30 dias.',
            emitidoEm: '2026-08-12T15:12:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 5001,
            tipo: 'EXAMES',
            titulo: 'Solicitacao de exames',
            descricao: 'Hemograma completo, perfil lipidico e eletrocardiograma.',
            emitidoEm: '2026-08-12T15:14:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 17,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-12T14:20:00',
            assinado: true,
            consultaId: 101
          }
        ]
      },
      {
        id: 102,
        dataHora: '2026-06-04T09:00:00',
        status: 'PAGO',
        especialidadeNome: 'Cardiologia',
        profissionalId: 10,
        profissionalNome: 'Dra. Helena Martins',
        tipoProfissionalNome: 'MEDICO',
        diagnostico: null,
        documentos: [
          {
            id: 102,
            tipo: 'COMPROVANTE_PAGAMENTO',
            titulo: 'Comprovante de pagamento',
            descricao: 'Pagamento de R$ 350,00 via Pix.',
            emitidoEm: '2026-06-04T09:45:00',
            assinado: false,
            consultaId: 102
          }
        ]
      }
    ]
  },
  {
    id: 2,
    nome: 'Joao Pereira Oliveira',
    cpf: '23456789012',
    telefone: '11976543210',
    email: 'joao.pereira@email.com',
    dataNascimento: '1990-07-22',
    sexo: 'Masculino',
    profissionalId: 20,
    profissionalNome: 'Dr. Rafael Nunes',
    ultimoAtendimento: '2026-08-10T10:15:00',
    totalConsultas: 1,
    totalDocumentos: 4,
    consultas: [
      {
        id: 201,
        dataHora: '2026-08-10T10:15:00',
        status: 'REALIZADA',
        especialidadeNome: 'Odontologia Restauradora',
        profissionalId: 20,
        profissionalNome: 'Dr. Rafael Nunes',
        tipoProfissionalNome: 'DENTISTA',
        diagnostico: 'Carie oclusal no dente 36 e gengivite localizada.',
        documentos: [
          {
            id: 7001,
            tipo: 'REGISTRO_CONSULTA',
            titulo: 'Registro da consulta',
            descricao: 'Carie oclusal no dente 36 e gengivite localizada.',
            emitidoEm: '2026-08-10T11:00:00',
            assinado: false,
            consultaId: 201
          },
          {
            id: 7001,
            tipo: 'PRESCRICAO',
            titulo: 'Receituario odontologico',
            descricao: 'Amoxicilina 500mg de 8 em 8 horas por 7 dias.',
            emitidoEm: '2026-08-10T11:05:00',
            assinado: false,
            consultaId: 201
          },
          {
            id: 9001,
            tipo: 'PLANEJAMENTO',
            titulo: 'Planejamento terapeutico',
            descricao: '3 procedimentos planejados',
            emitidoEm: '2026-08-10T11:10:00',
            assinado: true,
            consultaId: 201
          },
          {
            id: 18,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-10T10:05:00',
            assinado: true,
            consultaId: 201
          }
        ]
      }
    ]
  },
  {
    id: 3,
    nome: 'Ana Costa Ferreira',
    cpf: '34567890123',
    telefone: '21987654322',
    email: 'ana.costa@email.com',
    dataNascimento: '1988-11-08',
    sexo: 'Feminino',
    profissionalId: 20,
    profissionalNome: 'Dr. Rafael Nunes',
    ultimoAtendimento: '2026-08-13T10:43:00',
    totalConsultas: 1,
    totalDocumentos: 1,
    consultas: [
      {
        id: 6,
        dataHora: '2026-08-13T10:43:00',
        status: 'REALIZADA',
        especialidadeNome: 'Odontologia Geral',
        profissionalId: 20,
        profissionalNome: 'Dr. Rafael Nunes',
        tipoProfissionalNome: 'DENTISTA',
        diagnostico: null,
        documentos: [
          {
            id: 17,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-13T10:44:35',
            assinado: true,
            consultaId: 6
          }
        ]
      }
    ]
  },
  {
    id: 1,
    nome: 'Maria Silva Santos',
    cpf: '12345678901',
    telefone: '11987654321',
    email: 'maria.silva@email.com',
    dataNascimento: '1985-03-15',
    sexo: 'Feminino',
    profissionalId: 10,
    profissionalNome: 'Dra. Helena Martins',
    ultimoAtendimento: '2026-08-12T14:30:00',
    totalConsultas: 2,
    totalDocumentos: 5,
    consultas: [
      {
        id: 101,
        dataHora: '2026-08-12T14:30:00',
        status: 'REALIZADA',
        especialidadeNome: 'Cardiologia',
        profissionalId: 10,
        profissionalNome: 'Dra. Helena Martins',
        tipoProfissionalNome: 'MEDICO',
        diagnostico: 'Hipertensao arterial estagio 1, em acompanhamento.',
        documentos: [
          {
            id: 5001,
            tipo: 'REGISTRO_CONSULTA',
            titulo: 'Registro da consulta',
            descricao: 'Hipertensao arterial estagio 1, em acompanhamento.',
            emitidoEm: '2026-08-12T15:10:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 5001,
            tipo: 'PRESCRICAO',
            titulo: 'Receituario',
            descricao: 'Losartana 50mg, 1 comprimido ao dia por 30 dias.',
            emitidoEm: '2026-08-12T15:12:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 5001,
            tipo: 'EXAMES',
            titulo: 'Solicitacao de exames',
            descricao: 'Hemograma completo, perfil lipidico e eletrocardiograma.',
            emitidoEm: '2026-08-12T15:14:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 17,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-12T14:20:00',
            assinado: true,
            consultaId: 101
          }
        ]
      },
      {
        id: 102,
        dataHora: '2026-06-04T09:00:00',
        status: 'PAGO',
        especialidadeNome: 'Cardiologia',
        profissionalId: 10,
        profissionalNome: 'Dra. Helena Martins',
        tipoProfissionalNome: 'MEDICO',
        diagnostico: null,
        documentos: [
          {
            id: 102,
            tipo: 'COMPROVANTE_PAGAMENTO',
            titulo: 'Comprovante de pagamento',
            descricao: 'Pagamento de R$ 350,00 via Pix.',
            emitidoEm: '2026-06-04T09:45:00',
            assinado: false,
            consultaId: 102
          }
        ]
      }
    ]
  },
  {
    id: 2,
    nome: 'Joao Pereira Oliveira',
    cpf: '23456789012',
    telefone: '11976543210',
    email: 'joao.pereira@email.com',
    dataNascimento: '1990-07-22',
    sexo: 'Masculino',
    profissionalId: 20,
    profissionalNome: 'Dr. Rafael Nunes',
    ultimoAtendimento: '2026-08-10T10:15:00',
    totalConsultas: 1,
    totalDocumentos: 4,
    consultas: [
      {
        id: 201,
        dataHora: '2026-08-10T10:15:00',
        status: 'REALIZADA',
        especialidadeNome: 'Odontologia Restauradora',
        profissionalId: 20,
        profissionalNome: 'Dr. Rafael Nunes',
        tipoProfissionalNome: 'DENTISTA',
        diagnostico: 'Carie oclusal no dente 36 e gengivite localizada.',
        documentos: [
          {
            id: 7001,
            tipo: 'REGISTRO_CONSULTA',
            titulo: 'Registro da consulta',
            descricao: 'Carie oclusal no dente 36 e gengivite localizada.',
            emitidoEm: '2026-08-10T11:00:00',
            assinado: false,
            consultaId: 201
          },
          {
            id: 7001,
            tipo: 'PRESCRICAO',
            titulo: 'Receituario odontologico',
            descricao: 'Amoxicilina 500mg de 8 em 8 horas por 7 dias.',
            emitidoEm: '2026-08-10T11:05:00',
            assinado: false,
            consultaId: 201
          },
          {
            id: 9001,
            tipo: 'PLANEJAMENTO',
            titulo: 'Planejamento terapeutico',
            descricao: '3 procedimentos planejados',
            emitidoEm: '2026-08-10T11:10:00',
            assinado: true,
            consultaId: 201
          },
          {
            id: 18,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-10T10:05:00',
            assinado: true,
            consultaId: 201
          }
        ]
      }
    ]
  },
  {
    id: 3,
    nome: 'Ana Costa Ferreira',
    cpf: '34567890123',
    telefone: '21987654322',
    email: 'ana.costa@email.com',
    dataNascimento: '1988-11-08',
    sexo: 'Feminino',
    profissionalId: 20,
    profissionalNome: 'Dr. Rafael Nunes',
    ultimoAtendimento: '2026-08-13T10:43:00',
    totalConsultas: 1,
    totalDocumentos: 1,
    consultas: [
      {
        id: 6,
        dataHora: '2026-08-13T10:43:00',
        status: 'REALIZADA',
        especialidadeNome: 'Odontologia Geral',
        profissionalId: 20,
        profissionalNome: 'Dr. Rafael Nunes',
        tipoProfissionalNome: 'DENTISTA',
        diagnostico: null,
        documentos: [
          {
            id: 17,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-13T10:44:35',
            assinado: true,
            consultaId: 6
          }
        ]
      }
    ]
  },
  {
    id: 1,
    nome: 'Maria Silva Santos',
    cpf: '12345678901',
    telefone: '11987654321',
    email: 'maria.silva@email.com',
    dataNascimento: '1985-03-15',
    sexo: 'Feminino',
    profissionalId: 10,
    profissionalNome: 'Dra. Helena Martins',
    ultimoAtendimento: '2026-08-12T14:30:00',
    totalConsultas: 2,
    totalDocumentos: 5,
    consultas: [
      {
        id: 101,
        dataHora: '2026-08-12T14:30:00',
        status: 'REALIZADA',
        especialidadeNome: 'Cardiologia',
        profissionalId: 10,
        profissionalNome: 'Dra. Helena Martins',
        tipoProfissionalNome: 'MEDICO',
        diagnostico: 'Hipertensao arterial estagio 1, em acompanhamento.',
        documentos: [
          {
            id: 5001,
            tipo: 'REGISTRO_CONSULTA',
            titulo: 'Registro da consulta',
            descricao: 'Hipertensao arterial estagio 1, em acompanhamento.',
            emitidoEm: '2026-08-12T15:10:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 5001,
            tipo: 'PRESCRICAO',
            titulo: 'Receituario',
            descricao: 'Losartana 50mg, 1 comprimido ao dia por 30 dias.',
            emitidoEm: '2026-08-12T15:12:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 5001,
            tipo: 'EXAMES',
            titulo: 'Solicitacao de exames',
            descricao: 'Hemograma completo, perfil lipidico e eletrocardiograma.',
            emitidoEm: '2026-08-12T15:14:00',
            assinado: false,
            consultaId: 101
          },
          {
            id: 17,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-12T14:20:00',
            assinado: true,
            consultaId: 101
          }
        ]
      },
      {
        id: 102,
        dataHora: '2026-06-04T09:00:00',
        status: 'PAGO',
        especialidadeNome: 'Cardiologia',
        profissionalId: 10,
        profissionalNome: 'Dra. Helena Martins',
        tipoProfissionalNome: 'MEDICO',
        diagnostico: null,
        documentos: [
          {
            id: 102,
            tipo: 'COMPROVANTE_PAGAMENTO',
            titulo: 'Comprovante de pagamento',
            descricao: 'Pagamento de R$ 350,00 via Pix.',
            emitidoEm: '2026-06-04T09:45:00',
            assinado: false,
            consultaId: 102
          }
        ]
      }
    ]
  },
  {
    id: 2,
    nome: 'Joao Pereira Oliveira',
    cpf: '23456789012',
    telefone: '11976543210',
    email: 'joao.pereira@email.com',
    dataNascimento: '1990-07-22',
    sexo: 'Masculino',
    profissionalId: 20,
    profissionalNome: 'Dr. Rafael Nunes',
    ultimoAtendimento: '2026-08-10T10:15:00',
    totalConsultas: 1,
    totalDocumentos: 4,
    consultas: [
      {
        id: 201,
        dataHora: '2026-08-10T10:15:00',
        status: 'REALIZADA',
        especialidadeNome: 'Odontologia Restauradora',
        profissionalId: 20,
        profissionalNome: 'Dr. Rafael Nunes',
        tipoProfissionalNome: 'DENTISTA',
        diagnostico: 'Carie oclusal no dente 36 e gengivite localizada.',
        documentos: [
          {
            id: 7001,
            tipo: 'REGISTRO_CONSULTA',
            titulo: 'Registro da consulta',
            descricao: 'Carie oclusal no dente 36 e gengivite localizada.',
            emitidoEm: '2026-08-10T11:00:00',
            assinado: false,
            consultaId: 201
          },
          {
            id: 7001,
            tipo: 'PRESCRICAO',
            titulo: 'Receituario odontologico',
            descricao: 'Amoxicilina 500mg de 8 em 8 horas por 7 dias.',
            emitidoEm: '2026-08-10T11:05:00',
            assinado: false,
            consultaId: 201
          },
          {
            id: 9001,
            tipo: 'PLANEJAMENTO',
            titulo: 'Planejamento terapeutico',
            descricao: '3 procedimentos planejados',
            emitidoEm: '2026-08-10T11:10:00',
            assinado: true,
            consultaId: 201
          },
          {
            id: 18,
            tipo: 'QUESTIONARIO_SAUDE',
            titulo: 'Questionario de saude',
            descricao: 'Respondido e assinado pelo paciente',
            emitidoEm: '2026-08-10T10:05:00',
            assinado: true,
            consultaId: 201
          }
        ]
      }
    ]
  },
];
