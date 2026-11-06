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
 * - uma feature não importa outra;
 * - ninguém importa de testing/ fora de specs;
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
      comment: 'Uma feature não importa outra; o item compartilhado sobe para shared ou vira data-access público.',
      severity: 'error',
      from: { path: '^src/app/features/([^/]+)/' },
      to: { path: '^src/app/features/', pathNot: '^src/app/features/$1/' },
    },
    {
      name: 'testing-so-em-spec',
      comment: 'src/app/testing é infraestrutura de teste: só specs podem importar.',
      severity: 'error',
      from: { pathNot: '\\.spec\\.ts$' },
      to: { path: '^src/app/testing/' },
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
