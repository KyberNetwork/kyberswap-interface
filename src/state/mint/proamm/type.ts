export enum Field {
  CURRENCY_A = 'CURRENCY_A',
  CURRENCY_B = 'CURRENCY_B',
}

export enum Bound {
  LOWER = 'LOWER',
  UPPER = 'UPPER',
}

export enum RANGE {
  FULL_RANGE = 'FULL_RANGE',
  SAFE = 'SAFE',
  COMMON = 'COMMON',
  EXPERT = 'EXPERT',
}

export type FullRange = true

export type Point = 0 | 1 | 2 | 3 | 4 | 5
