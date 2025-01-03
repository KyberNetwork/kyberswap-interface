type BigintIsh = bigint | number | string

export enum FeeAmount {
  LOWEST = 100,
  LOW = 500,
  MIDDLE = 2500, // For Pancake temporary
  MEDIUM = 3000,
  HIGH = 10000,
}

/**
 * The default factory tick spacings by fee amount.
 */
export const TICK_SPACINGS = {
  [FeeAmount.LOWEST]: 1,
  [FeeAmount.LOW]: 10,
  [FeeAmount.MEDIUM]: 50,
  [FeeAmount.HIGH]: 200,
}

export const PRICE_FIXED_DIGITS = 8

export interface TickProcessed {
  tick: number
  liquidityActive: bigint
  liquidityNet: bigint
  price0: string
}

export interface TickDataRaw {
  index: string | number
  liquidityGross: BigintIsh
  liquidityNet: BigintIsh
}

export interface ChartEntry {
  activeLiquidity: number
  price0: number
}

export enum Bound {
  LOWER = 'LOWER',
  UPPER = 'UPPER',
}

interface Dimensions {
  width: number
  height: number
}

interface Margins {
  top: number
  right: number
  bottom: number
  left: number
}

export interface ZoomLevels {
  initialMin: number
  initialMax: number
  min: number
  max: number
}

export interface LiquidityChartRangeInputProps {
  // to distringuish between multiple charts in the DOM
  id?: string

  data: {
    series: ChartEntry[]
    current: number
  }
  ticksAtLimit: { [bound in Bound]?: boolean | undefined }

  dimensions: Dimensions
  margins: Margins

  interactive?: boolean

  brushLabels: (d: 'w' | 'e', x: number) => string
  brushDomain: [number, number] | undefined
  onBrushDomainChange: (domain: [number, number], mode: string | undefined) => void

  zoomLevels: ZoomLevels
  showZoomButtons?: boolean
}

export const ZOOM_LEVELS: Record<FeeAmount, ZoomLevels> = {
  [FeeAmount.LOWEST]: {
    initialMin: 0.999,
    initialMax: 1.001,
    min: 0.00001,
    max: 1.5,
  },
  [FeeAmount.LOW]: {
    initialMin: 0.8,
    initialMax: 1.2,
    min: 0.00001,
    max: 20,
  },
  [FeeAmount.MIDDLE]: {
    initialMin: 0.3,
    initialMax: 1.8,
    min: 0.00001,
    max: 20,
  },
  [FeeAmount.MEDIUM]: {
    initialMin: 0.3,
    initialMax: 1.8,
    min: 0.00001,
    max: 20,
  },
  [FeeAmount.HIGH]: {
    initialMin: 0.1,
    initialMax: 2,
    min: 0.00001,
    max: 20,
  },
}
