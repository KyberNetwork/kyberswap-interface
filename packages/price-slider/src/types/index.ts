/**
 * View range representing the visible tick range on the slider
 */
export interface ViewRange {
  min: number;
  max: number;
}

/**
 * Pool information required for price calculations
 */
export interface PoolInfo {
  tickSpacing: number;
  token0Decimals: number;
  token1Decimals: number;
  currentTick: number;
}

/**
 * Props for the PriceSlider component
 */
export interface PriceSliderProps {
  pool: PoolInfo;
  invertPrice?: boolean;
  tick?: number;
  setTick: (tick: number) => void;
  comparator?: 'gte' | 'lte';
  mode?: 'range-to-infinite';
}

/**
 * Props for the PriceAxis component
 */
export interface PriceAxisProps {
  viewRange: ViewRange;
  token0Decimals: number;
  token1Decimals: number;
  invertPrice?: boolean;
}

/**
 * Handle type for dragging state
 */
export type HandleType = 'price' | null;
