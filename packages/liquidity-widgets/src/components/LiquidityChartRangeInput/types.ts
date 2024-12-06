type BigintIsh = bigint | number | string;

export interface ChartEntry {
  activeLiquidity: number;
  price0: number;
}

interface Dimensions {
  width: number;
  height: number;
}

interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ZoomLevels {
  initialMin: number;
  initialMax: number;
  min: number;
  max: number;
}

export interface LiquidityChartRangeInputProps {
  // to distringuish between multiple charts in the DOM
  id?: string;

  data: {
    series: ChartEntry[];
    current: number;
  };
  ticksAtLimit: { [bound in Bound]?: boolean | undefined };

  styles: {
    area: {
      // color of the ticks in range
      selection: string;
    };

    brush: {
      handle: {
        west: string;
        east: string;
      };
    };
  };

  dimensions: Dimensions;
  margins: Margins;

  interactive?: boolean;

  brushLabels: (d: "w" | "e", x: number) => string;
  brushDomain: [number, number] | undefined;
  onBrushDomainChange: (
    domain: [number, number],
    mode: string | undefined
  ) => void;

  zoomLevels: ZoomLevels;
  showZoomButtons?: boolean;
}

export enum Bound {
  LOWER = "LOWER",
  UPPER = "UPPER",
}

export interface TickDataRaw {
  tick: string | number;
  liquidityGross: BigintIsh;
  liquidityNet: BigintIsh;
  price0: string;
}

// Tick with fields parsed to bigints, and active liquidity computed.
export interface TickProcessed {
  tick: number;
  liquidityActive: bigint;
  liquidityNet: bigint;
  price0: string;
}

export const ZOOM_LEVELS: Record<number, ZoomLevels> = {
  100: {
    initialMin: 0.999,
    initialMax: 1.001,
    min: 0.00001,
    max: 1.5,
  },
  500: {
    initialMin: 0.999,
    initialMax: 1.001,
    min: 0.00001,
    max: 1.5,
  },
  2500: {
    initialMin: 0.5,
    initialMax: 2,
    min: 0.00001,
    max: 20,
  },
  10000: {
    initialMin: 0.5,
    initialMax: 2,
    min: 0.00001,
    max: 20,
  },
};
