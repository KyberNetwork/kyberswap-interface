import { POOL_CATEGORY } from '@kyber/schema';

export const PRICE_FIXED_DIGITS = 8;

export const DEFAULT_DIMENSIONS = { width: 400, height: 200 };

export const DEFAULT_MARGINS = {
  top: 10,
  right: 0,
  bottom: 10,
  left: 0,
};

export const ZOOM_LEVELS = {
  [POOL_CATEGORY.STABLE_PAIR]: {
    initialMin: 0.999,
    initialMax: 1.001,
    min: 0.00001,
    max: 20,
  },
  [POOL_CATEGORY.CORRELATED_PAIR]: {
    initialMin: 0.998,
    initialMax: 1.002,
    min: 0.00001,
    max: 20,
  },
  [POOL_CATEGORY.COMMON_PAIR]: {
    initialMin: 0.8,
    initialMax: 1.2,
    min: 0.00001,
    max: 20,
  },
  [POOL_CATEGORY.EXOTIC_PAIR]: {
    initialMin: 0.55,
    initialMax: 1.45,
    min: 0.00001,
    max: 20,
  },
};
