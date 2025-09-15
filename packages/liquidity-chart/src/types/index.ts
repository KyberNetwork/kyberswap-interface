import type { ScaleLinear, ZoomTransform } from 'd3';

import { POOL_CATEGORY } from '@kyber/schema';

type BigintIsh = bigint | number | string;

export enum Bound {
  LOWER = 'LOWER',
  UPPER = 'UPPER',
}

export interface PoolInfo {
  fee: number | undefined;
  tickCurrent: number | undefined;
  tickSpacing: number | undefined;
  ticks: TickDataRaw[];
  liquidity: string;
  token0: PoolTokenInfo | undefined;
  token1: PoolTokenInfo | undefined;
  category: POOL_CATEGORY | undefined;
}

export interface PoolTokenInfo {
  decimals: number;
  name: string;
  symbol: string;
  address: string;
}

export interface TickProcessed {
  tick: number;
  price: string;
  liquidityActive: bigint;
  liquidityNet: bigint;
}

export interface TickDataRaw {
  index: string | number;
  liquidityGross: BigintIsh;
  liquidityNet: BigintIsh;
}

export interface ChartEntry {
  activeLiquidity: number;
  price: number;
}

export interface ZoomLevels {
  initialMin: number;
  initialMax: number;
  min: number;
  max: number;
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

interface ZoomPosition {
  top: string | undefined;
  left: string | undefined;
  right: string | undefined;
  bottom: string | undefined;
  gap: string | undefined;
}

export interface LiquidityChartRangeInputProps {
  id?: string; // to distringuish between multiple charts in the DOM
  pool: PoolInfo;
  price: {
    current: number | undefined;
    lower: string | null;
    upper: string | null;
  };
  ticksAtLimit: { [bound in Bound]?: boolean | undefined };
  revertPrice: boolean;
  dimensions?: Dimensions;
  margins?: Margins;
  zoomPosition?: ZoomPosition;
  zoomInIcon?: JSX.Element;
  zoomOutIcon?: JSX.Element;
  showLabelAsAmount?: boolean;
  alwaysShowLabel?: boolean;
  onBrushDomainChange?: (domain: [number, number], mode: string | undefined) => void;
}

export interface ChartProps {
  id?: string;
  data: {
    series: ChartEntry[];
    current: number;
  };
  dimensions: Dimensions;
  margins: Margins;
  brushDomain: [number, number] | undefined;
  zoomLevels: ZoomLevels;
  zoomPosition?: ZoomPosition;
  zoomInIcon?: JSX.Element;
  zoomOutIcon?: JSX.Element;
  alwaysShowLabel?: boolean;
  brushLabels: (d: 'w' | 'e', x: number) => string;
  onBrushDomainChange?: (domain: [number, number], mode: string | undefined) => void;
}

export interface AreaProps {
  series: ChartEntry[];
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  xValue: (d: ChartEntry) => number;
  yValue: (d: ChartEntry) => number;
  fill: string;
  opacity?: number;
}

export interface AxisBottomProps {
  xScale: ScaleLinear<number, number>;
  innerHeight: number;
  offset?: number;
}

export interface BrushProps {
  id: string;
  xScale: ScaleLinear<number, number>;
  brushExtent: [number, number];
  innerWidth: number;
  innerHeight: number;
  zoomInited: boolean;
  alwaysShowLabel?: boolean;
  brushLabelValue: (d: 'w' | 'e', x: number) => string;
  setBrushExtent?: (extent: [number, number], mode: string | undefined) => void;
}

export interface LineProps {
  value: number;
  xScale: ScaleLinear<number, number>;
  innerHeight: number;
}

export interface ZoomProps {
  svg: SVGElement | null;
  xScale: ScaleLinear<number, number>;
  width: number;
  height: number;
  showResetButton: boolean;
  zoomLevels: ZoomLevels;
  zoomPosition?: ZoomPosition;
  zoomInIcon?: JSX.Element;
  zoomOutIcon?: JSX.Element;
  setZoom: (transform: ZoomTransform) => void;
}
