// Animation Constants
/** Duration for zoom/auto-center animation in milliseconds */
export const ZOOM_DURATION = 400;

/** Delay before committing tick changes to parent in milliseconds */
export const DEBOUNCE_DELAY = 150;

/** Minimum LERP factor when handle is far from target (slower movement) */
export const HANDLE_LERP_MIN = 0.15;

/** Maximum LERP factor when handle is close to target (faster movement) */
export const HANDLE_LERP_MAX = 0.4;

/** Maximum ticks per frame to prevent jumpy handle movement */
export const MAX_TICK_SPEED = 2000;

// Slider Behavior Constants
/** Percentage from edge that triggers zoom out (ensures price labels visible) */
export const EDGE_THRESHOLD = 18;

/** Percentage padding on each side when auto-centering after drag */
export const AUTO_CENTER_PADDING = 25;

/** Minimum tick spacings between handles to prevent overlap (keep small for large tickSpacing pools) */
export const MIN_HANDLE_DISTANCE_MULTIPLIER = 1;

// Dynamic LERP Constants
/** Distance threshold (in ticks) for minimum lerp factor */
export const LERP_FAR_THRESHOLD = 5000;

/** Distance threshold (in ticks) for maximum lerp factor */
export const LERP_CLOSE_THRESHOLD = 100;

// Price Axis Constants
/** Maximum number of ticks on price axis for small ranges */
export const MAX_AXIS_TICK_COUNT = 11;

/** Minimum number of ticks on price axis for extreme ranges */
export const MIN_AXIS_TICK_COUNT = 2;

// Skeleton Constants
/** Positions for skeleton axis ticks (percentage) */
export const SKELETON_AXIS_POSITIONS = [0, 16.6, 33.3, 50, 66.6, 83.3, 100];
