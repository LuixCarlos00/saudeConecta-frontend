/**
 * Guarda de arquitetura do front (dependency-cruiser).
 *
 * Rodar: `npm run arquitetura`.
 *
 * As violações que já existiam quando a guarda foi ligada estão congeladas em
 * `.dependency-cruiser-known-violations.json` (baseline): o check passa com elas e
 * falha em qualquer violação NOVA. Ao corrigir uma violação antiga, regenere o
 * baseline com `npm run arquitetura:baseline` para ela não voltar escondida.
 *
 * Regras (plano de arquitetura, seção 3.2):
 * - shared não importa de core nem de features;
 * - core não importa de features;
 * - uma feature não importa outra, exceto pelo `features/<area>/index.ts` (API pública da área: só o que outra área precisa, como um service de data-access ou um diálogo);
 * - ninguém importa de testing/ fora de specs;
 * - só data-access (e core) usa HttpClient: features e shared fora de data-access não importam @angular/common/http (guards só tratam HttpErrorResponse);
 * - as pastas legadas util/ e services/ não existem mais;
 * - sem dependência circular.
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'shared-nao-importa-features',
      comment: 'shared é sem estado e reutilizável: não pode depender de uma feature.',
      severity: 'error',
      from: { path: '^src/app/shared/' },
      to: { path: '^src/app/features/' },
    },
    {
      name: 'shared-nao-importa-core',
      comment: 'shared não depende de core (singletons, auth, layout).',
      severity: 'error',
      from: { path: '^src/app/shared/' },
      to: { path: '^src/app/core/' },
    },
    {
      name: 'core-nao-importa-features',
      comment: 'core é carregado pelo AppModule e não pode depender de uma feature.',
      severity: 'error',
      from: { path: '^src/app/core/' },
      to: { path: '^src/app/features/' },
    },
    {
      name: 'feature-nao-importa-outra-feature',
      comment: 'Uma feature não importa outra; o item compartilhado sobe para shared ou vira API pública em features/<area>/index.ts (única porta de entrada permitida).',
      severity: 'error',
      from: { path: '^src/app/features/([^/]+)/' },
      to: { path: '^src/app/features/', pathNot: '^src/app/features/($1/|[^/]+/index\\.ts$)' },
    },
    {
      name: 'testing-so-em-spec',
      comment: 'src/app/testing é infraestrutura de teste: só specs podem importar.',
      severity: 'error',
      from: { pathNot: '\\.spec\\.ts$' },
      to: { path: '^src/app/testing/' },
    },
    {
      name: 'http-so-em-data-access',
      comment: 'Só a camada data-access (e o core) fala HTTP; telas e componentes consomem os services.',
      severity: 'error',
      from: { path: '^src/app/(features|shared)/', pathNot: '(/data-access/|/guards/|\\.spec\\.ts$)' },
      to: { path: '^node_modules/@angular/common/.*/http\\.mjs$' },
    },
    {
      name: 'sem-pastas-legadas',
      comment: 'util/ e services/ foram dissolvidos na F4: o código novo vai para core/, shared/ ou features/<area>/.',
      severity: 'error',
      from: {},
      to: { path: '^src/app/(util|services)/' },
    },
    {
      name: 'sem-dependencia-circular',
      comment: 'Ciclo de imports quebra a ordem de carga e indica responsabilidade mal dividida.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '^src/environments/' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      extensions: ['.ts', '.js'],
    },
  },
};
