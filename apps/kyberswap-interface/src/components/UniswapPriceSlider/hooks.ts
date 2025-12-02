import { nearestUsableTick } from '@kyber/utils/dist/uniswapv3'
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'

import type { ViewRange } from 'components/UniswapPriceSlider/types'

const DEBOUNCE_DELAY = 150 // ms
const ZOOM_DURATION = 400 // ms - duration for zoom/auto-center animation
const HANDLE_LERP_MIN = 0.15 // Min lerp factor when far from target
const HANDLE_LERP_MAX = 0.4 // Max lerp factor when close to target
const MAX_TICK_SPEED = 2000 // Maximum ticks per frame - increased for smoother tracking

// Easing function: ease-out cubic for smooth deceleration
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

/**
 * Hook for smooth zoom animation using easing function
 * Uses ease-out for natural deceleration feel
 */
export const useSmoothZoom = (
  viewRange: ViewRange | null,
  setViewRange: Dispatch<SetStateAction<ViewRange | null>>,
) => {
  const zoomAnimationRef = useRef<number | null>(null)
  const targetViewRangeRef = useRef<ViewRange | null>(null)
  const startViewRangeRef = useRef<ViewRange | null>(null)
  const startTimeRef = useRef<number>(0)

  const animateZoom = useCallback(() => {
    if (!targetViewRangeRef.current || !startViewRangeRef.current) {
      zoomAnimationRef.current = null
      return
    }

    const now = performance.now()
    const elapsed = now - startTimeRef.current
    const progress = Math.min(elapsed / ZOOM_DURATION, 1)
    const easedProgress = easeOutCubic(progress)

    const start = startViewRangeRef.current
    const target = targetViewRangeRef.current

    const newMin = start.min + (target.min - start.min) * easedProgress
    const newMax = start.max + (target.max - start.max) * easedProgress

    setViewRange({ min: newMin, max: newMax })

    if (progress < 1) {
      // Continue animation
      zoomAnimationRef.current = requestAnimationFrame(animateZoom)
    } else {
      // Animation complete - set exact target values
      setViewRange(target)
      targetViewRangeRef.current = null
      startViewRangeRef.current = null
      zoomAnimationRef.current = null
    }
  }, [setViewRange])

  const startSmoothZoom = useCallback(
    (targetMin: number, targetMax: number) => {
      // If already animating, use current position as new start
      if (zoomAnimationRef.current && viewRange) {
        startViewRangeRef.current = viewRange
      } else if (viewRange) {
        startViewRangeRef.current = viewRange
      }

      targetViewRangeRef.current = { min: targetMin, max: targetMax }
      startTimeRef.current = performance.now()

      if (!zoomAnimationRef.current) {
        zoomAnimationRef.current = requestAnimationFrame(animateZoom)
      }
    },
    [animateZoom, viewRange],
  )

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (zoomAnimationRef.current) {
        cancelAnimationFrame(zoomAnimationRef.current)
      }
    }
  }, [])

  return { startSmoothZoom }
}

/**
 * Hook for smooth tick updates with animation and debouncing
 * Handles move slowly/smoothly towards target position
 */
export const useDebouncedTicks = (
  lowerTick: number | undefined,
  upperTick: number | undefined,
  setLowerTick: (tick: number) => void,
  setUpperTick: (tick: number) => void,
  isDragging: boolean,
) => {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const animationRef = useRef<number | null>(null)

  // Target ticks (where user wants to go)
  const targetLowerTickRef = useRef<number | undefined>(lowerTick)
  const targetUpperTickRef = useRef<number | undefined>(upperTick)

  // Current internal tick values (tracked via refs for animation loop)
  const internalLowerRef = useRef<number | undefined>(lowerTick)
  const internalUpperRef = useRef<number | undefined>(upperTick)

  // Internal tick state for React rendering
  const [internalLowerTick, setInternalLowerTick] = useState<number | undefined>(lowerTick)
  const [internalUpperTick, setInternalUpperTick] = useState<number | undefined>(upperTick)

  // Helper: calculate dynamic lerp factor based on distance
  const getDynamicLerp = useCallback((diff: number): number => {
    const absDiff = Math.abs(diff)
    if (absDiff > 5000) return HANDLE_LERP_MIN
    if (absDiff < 100) return HANDLE_LERP_MAX
    const t = (absDiff - 100) / (5000 - 100)
    return HANDLE_LERP_MAX - t * (HANDLE_LERP_MAX - HANDLE_LERP_MIN)
  }, [])

  // Animation function for smooth handle movement
  const animateHandles = useCallback(() => {
    let needsAnimation = false

    // Update lower tick
    if (internalLowerRef.current !== undefined && targetLowerTickRef.current !== undefined) {
      const current = internalLowerRef.current
      const target = targetLowerTickRef.current
      const diff = target - current

      if (Math.abs(diff) >= 1) {
        needsAnimation = true
        const lerpFactor = getDynamicLerp(diff)
        const lerpMovement = diff * lerpFactor
        const cappedMovement = Math.sign(lerpMovement) * Math.min(Math.abs(lerpMovement), MAX_TICK_SPEED)
        const newValue = current + cappedMovement
        internalLowerRef.current = newValue
        setInternalLowerTick(newValue)
      } else if (current !== target) {
        internalLowerRef.current = target
        setInternalLowerTick(target)
      }
    }

    // Update upper tick
    if (internalUpperRef.current !== undefined && targetUpperTickRef.current !== undefined) {
      const current = internalUpperRef.current
      const target = targetUpperTickRef.current
      const diff = target - current

      if (Math.abs(diff) >= 1) {
        needsAnimation = true
        const lerpFactor = getDynamicLerp(diff)
        const lerpMovement = diff * lerpFactor
        const cappedMovement = Math.sign(lerpMovement) * Math.min(Math.abs(lerpMovement), MAX_TICK_SPEED)
        const newValue = current + cappedMovement
        internalUpperRef.current = newValue
        setInternalUpperTick(newValue)
      } else if (current !== target) {
        internalUpperRef.current = target
        setInternalUpperTick(target)
      }
    }

    if (needsAnimation) {
      animationRef.current = requestAnimationFrame(animateHandles)
    } else {
      animationRef.current = null
    }
  }, [getDynamicLerp])

  // Start animation if not already running
  const startAnimation = useCallback(() => {
    if (!animationRef.current) {
      animationRef.current = requestAnimationFrame(animateHandles)
    }
  }, [animateHandles])

  // Sync internal state with props when not dragging
  useEffect(() => {
    if (!isDragging) {
      targetLowerTickRef.current = lowerTick
      targetUpperTickRef.current = upperTick
      internalLowerRef.current = lowerTick
      internalUpperRef.current = upperTick
      setInternalLowerTick(lowerTick)
      setInternalUpperTick(upperTick)
    }
  }, [lowerTick, upperTick, isDragging])

  // Smooth update functions - set target and start animation
  const debouncedSetLowerTick = useCallback(
    (tick: number) => {
      targetLowerTickRef.current = tick
      startAnimation()

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        setLowerTick(tick)
      }, DEBOUNCE_DELAY)
    },
    [setLowerTick, startAnimation],
  )

  const debouncedSetUpperTick = useCallback(
    (tick: number) => {
      targetUpperTickRef.current = tick
      startAnimation()

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        setUpperTick(tick)
      }, DEBOUNCE_DELAY)
    },
    [setUpperTick, startAnimation],
  )

  // Flush debounced values immediately
  const flushDebouncedValues = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    // Set final values from targets
    const finalLower = targetLowerTickRef.current
    const finalUpper = targetUpperTickRef.current

    if (finalLower !== undefined && finalLower !== lowerTick) {
      setLowerTick(finalLower)
      internalLowerRef.current = finalLower
      setInternalLowerTick(finalLower)
    }
    if (finalUpper !== undefined && finalUpper !== upperTick) {
      setUpperTick(finalUpper)
      internalUpperRef.current = finalUpper
      setInternalUpperTick(finalUpper)
    }

    // Stop animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [lowerTick, upperTick, setLowerTick, setUpperTick])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Get target ticks (what user actually wants, not the animated value)
  const getTargetTicks = useCallback(() => {
    return {
      lowerTick: targetLowerTickRef.current,
      upperTick: targetUpperTickRef.current,
    }
  }, [])

  return {
    internalLowerTick,
    internalUpperTick,
    debouncedSetLowerTick,
    debouncedSetUpperTick,
    flushDebouncedValues,
    getTargetTicks,
  }
}

/**
 * Hook for converting between tick and position
 * When invertPrice = true, the entire visual is flipped:
 * - Lower tick (higher inverted price) appears on the RIGHT
 * - Upper tick (lower inverted price) appears on the LEFT
 * - Axis shows inverted prices from low (left) to high (right)
 */
export const useTickPositionConverter = (viewRange: ViewRange | null, tickSpacing: number, invertPrice?: boolean) => {
  const getPositionFromTick = useCallback(
    (tick: number): number => {
      if (!viewRange) return 50
      const { min, max } = viewRange
      const normalPosition = ((tick - min) / (max - min)) * 100
      // When invertPrice, flip the position so higher inverted price is on the right
      return invertPrice ? 100 - normalPosition : normalPosition
    },
    [viewRange, invertPrice],
  )

  const getTickFromPosition = useCallback(
    (position: number): number => {
      if (!viewRange) return 0
      const { min, max } = viewRange
      // When invertPrice, flip the position first
      const actualPosition = invertPrice ? 100 - position : position
      const tick = min + (actualPosition / 100) * (max - min)
      return nearestUsableTick(Math.round(tick), tickSpacing)
    },
    [viewRange, tickSpacing, invertPrice],
  )

  return { getPositionFromTick, getTickFromPosition }
}
