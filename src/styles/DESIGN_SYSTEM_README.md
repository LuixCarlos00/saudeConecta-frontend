# 🏥 SaudeConecta - Healthcare Design System

## Visão Geral

Design System especializado para sistemas de gestão médica, seguindo as melhores práticas de Healthcare UX/UI.

### Princípios de Design

1. **Segurança em Primeiro Lugar** - Dados críticos sempre visíveis
2. **Eficiência Clínica** - Menos cliques, mais tempo com o paciente
3. **Prevenção de Erros** - Validações visuais em tempo real
4. **Acessibilidade** - WCAG 2.1 AA compliance
5. **Consistência** - Padrões visuais uniformes

---

## 📁 Estrutura de Arquivos

```
src/styles/
├── design-system/
│   ├── _variables.scss    # Tokens de design (cores, tipografia, espaçamento)
│   ├── _mixins.scss       # Funções SCSS reutilizáveis
│   ├── _components.scss   # Classes de componentes
│   ├── _utilities.scss    # Classes utilitárias
│   └── index.scss         # Ponto de entrada
├── global.scss            # Estilos globais da aplicação
└── DESIGN_SYSTEM_README.md
```

---

## 🎨 Paleta de Cores

### Cores Primárias
| Variável | Valor | Uso |
|----------|-------|-----|
| `$primary-blue` | #0066CC | Ações principais, links |
| `$primary-teal` | #00A3A3 | Ações secundárias |

### Cores de Status Clínico (CRÍTICO)
| Variável | Valor | Uso |
|----------|-------|-----|
| `$status-normal` | #10B981 | Valores normais |
| `$status-atencao` | #F59E0B | Atenção necessária |
| `$status-critico` | #EF4444 | Crítico/Emergência |
| `$status-info` | #3B82F6 | Informativo |

### Cores de Prioridade (Triagem)
| Variável | Valor | Uso |
|----------|-------|-----|
| `$priority-urgent` | #DC2626 | Urgente |
| `$priority-high` | #F97316 | Alta |
| `$priority-medium` | #EAB308 | Média |
| `$priority-low` | #22C55E | Baixa |
| `$priority-routine` | #6B7280 | Rotina |

---

## 📝 Tipografia

### Fontes
- **Principal**: Inter, system fonts
- **Monospace**: JetBrains Mono (para IDs, códigos)

### Tamanhos
| Variável | Tamanho | Uso |
|----------|---------|-----|
| `$text-xs` | 12px | Labels pequenos |
| `$text-sm` | 14px | Texto secundário |
| `$text-base` | 16px | Texto principal (MÍNIMO para dados médicos) |
| `$text-lg` | 18px | Destaque |
| `$text-xl` | 20px | Subtítulos |
| `$text-2xl` | 24px | Títulos |

### ⚠️ REGRA CRÍTICA
**Dados do paciente e sinais vitais NUNCA devem ter fonte menor que 16px!**

---

## 🧩 Componentes Healthcare

### 1. Patient Header (`app-patient-header`)
Cabeçalho sticky com informações críticas do paciente.

```html
<app-patient-header 
  [patient]="pacienteData"
  [showActions]="true"
  (onAction)="handleAction($event)">
</app-patient-header>
```

**Características:**
- Alergias sempre visíveis no topo
- Foto com tipo sanguíneo
- Condições crônicas em destaque
- Ações rápidas (prescrição, exame, atestado)

### 2. Vital Signs (`app-vital-signs`)
Entrada e visualização de sinais vitais com validação visual.

```html
<app-vital-signs
  [vitals]="sinaisVitais"
  [editable]="true"
  [showIMC]="true"
  (vitalChange)="onVitalChange($event)">
</app-vital-signs>
```

**Características:**
- Validação em tempo real
- Cores de status (normal, atenção, crítico)
- Cálculo automático de IMC
- Ranges configuráveis

### 3. Patient Queue (`app-patient-queue`)
Fila de pacientes com status e prioridades.

```html
<app-patient-queue
  [queue]="filaPacientes"
  [showActions]="true"
  (itemSelected)="onPatientSelect($event)"
  (itemAction)="onPatientAction($event)">
</app-patient-queue>
```

**Características:**
- Ordenação automática por status
- Indicadores de prioridade
- Tempo de espera calculado
- Alertas de alergia visíveis

### 4. Medical Alert (`app-medical-alert`)
Alertas e notificações médicas.

```html
<app-medical-alert
  type="critical"
  title="Exame Crítico"
  message="Glicemia 350mg/dL"
  [dismissible]="true"
  (closed)="onAlertClose()">
</app-medical-alert>
```

**Tipos:** `info`, `success`, `warning`, `danger`, `critical`

---

## 🎯 Classes Utilitárias

### Display
```css
.d-none, .d-block, .d-flex, .d-grid
.d-sm-none, .d-md-block, .d-lg-flex
```

### Flexbox
```css
.flex-row, .flex-column, .flex-wrap
.justify-start, .justify-center, .justify-between
.items-start, .items-center, .items-end
.gap-1, .gap-2, .gap-4, .gap-6
```

### Espaçamento
```css
.m-0 a .m-8, .mt-*, .mb-*, .ml-*, .mr-*, .mx-*, .my-*
.p-0 a .p-8, .pt-*, .pb-*, .pl-*, .pr-*, .px-*, .py-*
```

### Tipografia
```css
.text-xs, .text-sm, .text-base, .text-lg, .text-xl
.font-normal, .font-medium, .font-semibold, .font-bold
.text-primary, .text-secondary, .text-muted
.text-success, .text-warning, .text-danger
```

### Healthcare Específico
```css
.patient-data       /* Dados do paciente - mínimo 16px */
.vital-data         /* Sinais vitais - fonte mono */
.alert-critical-text /* Alertas críticos */
.status-border-normal, .status-border-attention, .status-border-critical
```

---

## 🔧 Mixins Disponíveis

### Responsividade
```scss
@include mobile { ... }
@include tablet { ... }
@include desktop { ... }
@include min-width($breakpoint) { ... }
@include max-width($breakpoint) { ... }
```

### Componentes
```scss
@include card;
@include card-flat;
@include patient-card;
@include alert-card-critical;

@include btn-primary;
@include btn-secondary;
@include btn-danger;
@include btn-emergency;

@include input-base;
@include textarea;
@include select;

@include table;
@include table-header;
@include table-row;

@include badge-primary;
@include badge-danger;
@include badge-allergy;

@include alert-info;
@include alert-danger;
@include alert-critical-medical;
```

---

## 📱 Breakpoints

| Nome | Valor | Uso |
|------|-------|-----|
| `$breakpoint-xs` | 320px | Mobile pequeno |
| `$breakpoint-sm` | 640px | Mobile grande |
| `$breakpoint-md` | 768px | Tablet |
| `$breakpoint-lg` | 1024px | Desktop pequeno |
| `$breakpoint-xl` | 1280px | Desktop |
| `$breakpoint-2xl` | 1536px | Desktop grande |

---

## ♿ Acessibilidade

### Contraste
- Texto principal: ratio mínimo 4.5:1
- Texto grande: ratio mínimo 3:1
- Elementos interativos: indicador de foco visível

### Navegação por Teclado
- Todos os elementos interativos são focáveis
- Ordem de tabulação lógica
- Skip links disponíveis

### Screen Readers
- Classe `.sr-only` para conteúdo apenas para leitores
- `aria-live` para alertas dinâmicos
- Labels descritivos em todos os inputs

---

## 🖨️ Impressão

Estilos de impressão otimizados:
- Remoção de elementos não essenciais
- Cores adaptadas para impressão
- Quebras de página controladas
- Dados do paciente sempre visíveis

---

## 🚀 Como Usar

### 1. Importar em um componente SCSS
```scss
@import 'design-system/variables';
@import 'design-system/mixins';

.meu-componente {
  @include card;
  
  &__titulo {
    @include heading-3;
  }
  
  &__botao {
    @include btn-primary;
  }
}
```

### 2. Usar classes utilitárias no template
```html
<div class="hc-card p-4 mb-6">
  <h3 class="text-xl font-semibold mb-4">Título</h3>
  <p class="text-secondary">Conteúdo</p>
  <button class="hc-btn hc-btn--primary mt-4">Ação</button>
</div>
```

### 3. Usar componentes standalone
```typescript
import { PatientHeaderComponent } from '@shared/components';

@Component({
  imports: [PatientHeaderComponent],
  // ...
})
```

---

## 📋 Checklist de Implementação

- [x] Design tokens (cores, tipografia, espaçamento)
- [x] Mixins reutilizáveis
- [x] Componentes base (cards, botões, inputs)
- [x] Componentes Healthcare (patient-header, vital-signs, queue)
- [x] Classes utilitárias
- [x] Estilos globais
- [x] Suporte a impressão
- [x] Acessibilidade básica
- [ ] Dark mode (preparado, não implementado)
- [ ] Testes de acessibilidade completos
- [ ] Documentação de componentes com Storybook

---

## 🔗 Referências

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Healthcare UX Best Practices](https://www.nngroup.com/articles/healthcare-ux/)
- [Angular Material](https://material.angular.io/)
- [Tailwind CSS](https://tailwindcss.com/) (inspiração para utilitários)
