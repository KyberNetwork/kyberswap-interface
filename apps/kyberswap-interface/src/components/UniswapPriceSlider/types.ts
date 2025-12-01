/**
 * View range representing the visible tick range on the slider
 */
export interface ViewRange {
  min: number
  max: number
}

/**
 * Pool information required for price calculations
 */
export interface PoolInfo {
  tickSpacing: number
  token0Decimals: number
  token1Decimals: number
  currentTick: number
}

/**
 * Props for the UniswapPriceSlider component
 */
export interface UniswapPriceSliderProps {
  pool: PoolInfo
  invertPrice?: boolean
  lowerTick?: number
  upperTick?: number
  setLowerTick: (tick: number) => void
  setUpperTick: (tick: number) => void
}

/**
 * Props for the PriceAxis component
 */
export interface PriceAxisProps {
  viewRange: ViewRange
  token0Decimals: number
  token1Decimals: number
  invertPrice?: boolean
}

/**
 * Handle type for dragging state
 */
export type HandleType = 'lower' | 'upper' | null
