/**
 * SVG anatômico para todos os dentes do odontograma FDI
 * Cada dente tem forma anatômica real baseada no tipo:
 *   - Incisivo Central, Incisivo Lateral, Canino
 *   - Pré-molar 1, Pré-molar 2
 *   - Molar 1, Molar 2, Molar 3 (siso)
 *
 * viewBox de cada SVG: "0 0 40 52"
 */

export interface ToothSVGData {
  outerPath: string;   // contorno externo do dente
  innerPath: string;   // área oclusal / superfície (cúspides)
  rootPath: string;    // raiz(es)
}

// ─── HELPERS DE PATH ─────────────────────────────────────────────────────────
// Todos os paths são coordenadas relativas ao viewBox 40x52
// Coroa ocupa y=0..30, raiz y=30..52

// ─── INCISIVO CENTRAL (11, 21, 31, 41) ────────────────────────────────────
const incisorCentral: ToothSVGData = {
  outerPath: `
    M 20 2
    C 27 2, 34 7, 34 16
    C 34 24, 29 30, 20 31
    C 11 30, 6 24, 6 16
    C 6 7, 13 2, 20 2 Z
  `,
  innerPath: `
    M 20 7
    C 25 7, 29 11, 29 17
    C 29 22, 25 27, 20 27
    C 15 27, 11 22, 11 17
    C 11 11, 15 7, 20 7 Z
  `,
  rootPath: `
    M 16 31 C 15 38, 14 44, 17 50
    C 18 52, 22 52, 23 50
    C 26 44, 25 38, 24 31 Z
  `,
};

// ─── INCISIVO LATERAL (12, 22, 32, 42) ────────────────────────────────────
const incisorLateral: ToothSVGData = {
  outerPath: `
    M 20 3
    C 26 3, 32 8, 32 16
    C 32 23, 27 30, 20 31
    C 13 30, 8 23, 8 16
    C 8 8, 14 3, 20 3 Z
  `,
  innerPath: `
    M 20 8
    C 24 8, 27 12, 27 17
    C 27 22, 24 27, 20 27
    C 16 27, 13 22, 13 17
    C 13 12, 16 8, 20 8 Z
  `,
  rootPath: `
    M 16 31 C 15 39, 15 44, 17 50
    C 18.5 52, 21.5 52, 23 50
    C 25 44, 25 39, 24 31 Z
  `,
};

// ─── CANINO (13, 23, 33, 43) ──────────────────────────────────────────────
const canine: ToothSVGData = {
  outerPath: `
    M 20 2
    C 27 2, 34 8, 34 17
    C 34 25, 28 31, 20 32
    C 12 31, 6 25, 6 17
    C 6 8, 13 2, 20 2 Z
  `,
  innerPath: `
    M 20 6
    L 27 19
    C 25 26, 15 26, 13 19 Z
  `,
  rootPath: `
    M 16 32 C 14 39, 13 45, 16 51
    C 17.5 53, 22.5 53, 24 51
    C 27 45, 26 39, 24 32 Z
  `,
};

// ─── PRÉ-MOLAR 1 (14, 24, 34, 44) ────────────────────────────────────────
const premolar1: ToothSVGData = {
  outerPath: `
    M 8 5
    C 8 3, 32 3, 32 5
    C 34 10, 34 22, 32 29
    C 28 32, 12 32, 8 29
    C 6 22, 6 10, 8 5 Z
  `,
  innerPath: `
    M 20 9
    C 26 9, 29 13, 29 18
    C 29 23, 26 27, 20 27
    C 14 27, 11 23, 11 18
    C 11 13, 14 9, 20 9 Z
  `,
  rootPath: `
    M 13 32 C 11 38, 11 44, 13 50
    C 14 52, 17 52, 18 50
    C 19 46, 19 40, 18 32
    M 22 32 C 21 40, 21 46, 22 50
    C 23 52, 26 52, 27 50
    C 29 44, 29 38, 27 32 Z
  `,
};

// ─── PRÉ-MOLAR 2 (15, 25, 35, 45) ────────────────────────────────────────
const premolar2: ToothSVGData = {
  outerPath: `
    M 8 5
    C 8 3, 32 3, 32 5
    C 34 10, 34 22, 32 29
    C 28 32, 12 32, 8 29
    C 6 22, 6 10, 8 5 Z
  `,
  innerPath: `
    M 20 8
    C 27 8, 30 13, 30 18
    C 30 23, 27 28, 20 28
    C 13 28, 10 23, 10 18
    C 10 13, 13 8, 20 8 Z
  `,
  rootPath: `
    M 14 32 C 13 38, 13 45, 15 51
    C 16.5 53, 23.5 53, 25 51
    C 27 45, 27 38, 26 32 Z
  `,
};

// ─── MOLAR 1 (16, 26, 36, 46) ─────────────────────────────────────────────
const molar1: ToothSVGData = {
  outerPath: `
    M 6 5
    C 6 2, 34 2, 34 5
    C 37 11, 37 24, 34 31
    C 30 34, 10 34, 6 31
    C 3 24, 3 11, 6 5 Z
  `,
  innerPath: `
    M 20 8 L 28 11 L 30 20 L 26 27 L 14 27 L 10 20 L 12 11 Z
  `,
  rootPath: `
    M 9 34 C 7 39, 7 44, 9 50
    C 10 52, 13 52, 14 50
    C 15 46, 15 41, 14 34
    M 20 34 C 19 41, 19 46, 20 50
    C 21 52, 22 52, 22 50
    C 23 46, 22 41, 21 34
    M 26 34 C 25 41, 25 46, 26 50
    C 27 52, 30 52, 31 50
    C 33 44, 33 39, 31 34 Z
  `,
};

// ─── MOLAR 2 (17, 27, 37, 47) ─────────────────────────────────────────────
const molar2: ToothSVGData = {
  outerPath: `
    M 6 5
    C 6 2, 34 2, 34 5
    C 37 11, 37 24, 34 31
    C 30 34, 10 34, 6 31
    C 3 24, 3 11, 6 5 Z
  `,
  innerPath: `
    M 14 10 L 26 10 L 30 18 L 26 26 L 14 26 L 10 18 Z
  `,
  rootPath: `
    M 10 34 C 8 39, 8 45, 10 50
    C 11.5 52, 14 52, 15 50
    C 16 46, 16 40, 15 34
    M 25 34 C 24 40, 24 46, 25 50
    C 26 52, 28.5 52, 30 50
    C 32 45, 32 39, 30 34 Z
  `,
};

// ─── MOLAR 3 / SISO (18, 28, 38, 48) ─────────────────────────────────────
const molar3: ToothSVGData = {
  outerPath: `
    M 8 6
    C 8 3, 32 3, 32 6
    C 35 12, 35 23, 32 30
    C 28 33, 12 33, 8 30
    C 5 23, 5 12, 8 6 Z
  `,
  innerPath: `
    M 14 11 L 26 11 L 29 18 L 26 25 L 14 25 L 11 18 Z
  `,
  rootPath: `
    M 13 33 C 12 38, 12 43, 14 48
    C 15 50, 17 50, 18 48
    C 19 44, 18 39, 17 33
    M 23 33 C 22 39, 21 44, 22 48
    C 23 50, 25 50, 26 48
    C 28 43, 28 38, 27 33 Z
  `,
};

// ─── MAPA DE TIPO POR NÚMERO FDI ──────────────────────────────────────────

type ToothType = 'incisorCentral' | 'incisorLateral' | 'canine'
  | 'premolar1' | 'premolar2' | 'molar1' | 'molar2' | 'molar3';

const TOOTH_TYPE_MAP: Record<number, ToothType> = {
  // Q1 (adulto superior direito) — espelhado
  11: 'incisorCentral', 12: 'incisorLateral', 13: 'canine',
  14: 'premolar1', 15: 'premolar2',
  16: 'molar1', 17: 'molar2', 18: 'molar3',
  // Q2 (adulto superior esquerdo)
  21: 'incisorCentral', 22: 'incisorLateral', 23: 'canine',
  24: 'premolar1', 25: 'premolar2',
  26: 'molar1', 27: 'molar2', 28: 'molar3',
  // Q4 (adulto inferior direito) — espelhado
  41: 'incisorCentral', 42: 'incisorLateral', 43: 'canine',
  44: 'premolar1', 45: 'premolar2',
  46: 'molar1', 47: 'molar2', 48: 'molar3',
  // Q3 (adulto inferior esquerdo)
  31: 'incisorCentral', 32: 'incisorLateral', 33: 'canine',
  34: 'premolar1', 35: 'premolar2',
  36: 'molar1', 37: 'molar2', 38: 'molar3',
};

const SVG_DATA_MAP: Record<ToothType, ToothSVGData> = {
  incisorCentral: incisorCentral,
  incisorLateral: incisorLateral,
  canine: canine,
  premolar1: premolar1,
  premolar2: premolar2,
  molar1: molar1,
  molar2: molar2,
  molar3: molar3,
};

export function getToothSVG(toothNumber: number): ToothSVGData {
  const type = TOOTH_TYPE_MAP[toothNumber] ?? 'molar1';
  return SVG_DATA_MAP[type];
}

/** Quadrantes Q1 e Q4 são espelhados horizontalmente */
export function isFlipped(toothNumber: number): boolean {
  const q = Math.floor(toothNumber / 10);
  return q === 1 || q === 4;
}
