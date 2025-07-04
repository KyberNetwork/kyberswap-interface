export enum FeeAmount {
  LOWEST = 0.01,
  LOW = 0.05,
  //   MIDDLE = 0.25,
  MEDIUM = 0.3,
  HIGH = 1,
}

export const DEFAULT_PRICE_RANGE = {
  [FeeAmount.LOWEST]: 0.005,
  [FeeAmount.LOW]: 0.05,
  [FeeAmount.MEDIUM]: 0.2,
  [FeeAmount.HIGH]: 0.5,
};

export const FULL_PRICE_RANGE = 'Full Range';

export const PRICE_RANGE = {
  [FeeAmount.LOWEST]: [FULL_PRICE_RANGE, 0.01, 0.005, 0.001],
  [FeeAmount.LOW]: [FULL_PRICE_RANGE, 0.1, 0.05, 0.01],
  [FeeAmount.MEDIUM]: [FULL_PRICE_RANGE, 0.3, 0.2, 0.1],
  [FeeAmount.HIGH]: [FULL_PRICE_RANGE, 0.8, 0.5, 0.2],
};
