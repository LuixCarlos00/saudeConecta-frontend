# SaudeConecta

Sistema de Gestão de Clínica Médica desenvolvido em Angular 17.

## 📋 Descrição

SaudeConecta é uma aplicação web para gestão de clínicas médicas que permite:

- **Agendamento de Consultas**: Gerenciamento completo de agenda médica
- **Cadastro de Pacientes**: Registro e histórico de pacientes
- **Cadastro de Médicos**: Gestão de profissionais e especialidades
- **Prontuário Eletrônico**: Registro de consultas e histórico médico
- **Dashboard**: Métricas e gráficos de acompanhamento
- **Geração de PDFs**: Receitas, atestados e solicitações de exames
- **Controle de Acesso**: Roles (Admin, Médico, Secretária)

## 🛠️ Tecnologias

- **Framework**: Angular 17.3.1
- **UI**: Angular Material 17.3.1
- **Gráficos**: ng2-charts / Chart.js
- **Autenticação**: JWT (@auth0/angular-jwt)
- **Rich Text**: ngx-quill
- **PDF**: html2pdf.js
- **Alertas**: SweetAlert2
- **Datas**: date-fns

## 📁 Estrutura do Projeto

```
src/app/
├── core/                    # Serviços singleton, guards, interceptors
│   ├── guards/              # AuthGuard, GuestGuard, RoleGuard
│   ├── interceptors/        # Auth, Error, Ngrok interceptors
│   └── services/            # AuthService, ErrorHandlerService
├── shared/                  # Componentes e módulos reutilizáveis
│   ├── constants/           # Roles, API endpoints
│   ├── models/              # Interfaces padronizadas
│   └── shared.module.ts     # Módulo compartilhado
├── features/                # Funcionalidades Admin/Secretaria
│   ├── cadastro/            # Cadastros diversos
│   ├── dashboard/           # Dashboard com gráficos
│   ├── gerenciamento/       # Agenda e consultas
│   └── login/               # Autenticação
├── features-Medico/         # Funcionalidades do Médico
│   ├── gerenciamentoProntuario/
│   ├── historicos/
│   └── impressoes-PDF/
├── service/                 # Serviços HTTP (legacy)
└── util/                    # Utilitários (legacy)
```

## 🚀 Instalação

```bash
# Clone o repositório
git clone https://github.com/LuixCarlos00/saudeConecta-web.git

# Entre no diretório
cd saudeConecta/saudeConecta

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm start
```

## 💻 Desenvolvimento

```bash
# Servidor de desenvolvimento
npm start
# Acesse: http://localhost:4200

# Build de produção
npm run build

# Executar testes
npm test
```

## ⚙️ Configuração

### Variáveis de Ambiente

O arquivo `src/environments/environment.ts` contém as configurações:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'  // URL do backend
};
```

## 🔐 Autenticação

O sistema utiliza JWT para autenticação com três roles:

- `[ROLE_ADMIN]` - Administrador
- `[ROLE_Medico]` - Médico
- `[ROLE_Secretaria]` - Secretária

## 📚 Documentação

- [Relatório de Análise e Refatoração](../ANALISE_REFATORACAO.md)

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado.
