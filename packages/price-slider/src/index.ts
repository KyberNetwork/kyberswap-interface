// Import styles for CSS bundling
import '@/styles.css';

// Main component - export both default and named for flexibility
export { default } from '@/components/UniswapPriceSlider';
export { default as UniswapPriceSlider } from '@/components/UniswapPriceSlider';

// Sub-components export
export { default as PriceAxis } from '@/components/PriceAxis';
export { default as PriceSliderSkeleton } from '@/components/Skeleton';

// Types export
export type { HandleType, PoolInfo, PriceAxisProps, UniswapPriceSliderProps, ViewRange } from '@/types';

// Hooks export
export { useDebouncedTicks, useSmoothZoom, useTickPositionConverter } from '@/hooks';

// Utils export
export { brushHandlePath, formatAxisPrice, formatDisplayNumber, getEdgeIntensity } from '@/utils';

// Constants export
export {
  AUTO_CENTER_PADDING,
  DEBOUNCE_DELAY,
  EDGE_THRESHOLD,
  HANDLE_LERP_MAX,
  HANDLE_LERP_MIN,
  LERP_CLOSE_THRESHOLD,
  LERP_FAR_THRESHOLD,
  MAX_AXIS_TICK_COUNT,
  MAX_TICK_SPEED,
  MIN_AXIS_TICK_COUNT,
  MIN_HANDLE_DISTANCE_MULTIPLIER,
  SKELETON_AXIS_POSITIONS,
  ZOOM_DURATION,
} from '@/constants';
