import type { ZoomLevels } from "@/types";
import { FeeAmount } from "@/types";

export const PRICE_FIXED_DIGITS = 8;

export const DEFAULT_DIMENSIONS = { width: 400, height: 200 };

export const DEFAULT_MARGINS = {
  top: 10,
  right: 0,
  bottom: 10,
  left: 0,
};

export const ZOOM_LEVELS: Record<FeeAmount, ZoomLevels> = {
  [FeeAmount.LOWEST]: {
    initialMin: 0.99,
    initialMax: 1.01,
    min: 0.00001,
    max: 20,
  },
  [FeeAmount.LOW]: {
    initialMin: 0.91,
    initialMax: 1.09,
    min: 0.00001,
    max: 20,
  },
  [FeeAmount.MIDDLE]: {
    initialMin: 0.6,
    initialMax: 1.4,
    min: 0.00001,
    max: 20,
  },
  [FeeAmount.MEDIUM]: {
    initialMin: 0.6,
    initialMax: 1.4,
    min: 0.00001,
    max: 20,
  },
  [FeeAmount.HIGH]: {
    initialMin: 0.1,
    initialMax: 1.9,
    min: 0.00001,
    max: 20,
  },
};
