import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DEBOUNCE_DELAY,
  HANDLE_LERP_MAX,
  HANDLE_LERP_MIN,
  LERP_CLOSE_THRESHOLD,
  LERP_FAR_THRESHOLD,
  MAX_TICK_SPEED,
} from '@/constants';

/**
 * Hook for smooth tick updates with animation and debouncing for single price handle
 * Handles move slowly/smoothly towards target position
 */
export const useDebouncedTick = (
  priceTick: number | undefined,
  setPriceTick: (tick: number) => void,
  isDragging: boolean,
) => {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // Target tick (where user wants to go)
  const targetTickRef = useRef<number | undefined>(priceTick);

  // Current internal tick value (tracked via refs for animation loop)
  const internalTickRef = useRef<number | undefined>(priceTick);

  // Internal tick state for React rendering
  const [internalTick, setInternalTick] = useState<number | undefined>(priceTick);

  // Helper: calculate dynamic lerp factor based on distance
  const getDynamicLerp = useCallback((diff: number): number => {
    const absDiff = Math.abs(diff);
    if (absDiff > LERP_FAR_THRESHOLD) return HANDLE_LERP_MIN;
    if (absDiff < LERP_CLOSE_THRESHOLD) return HANDLE_LERP_MAX;
    const t = (absDiff - LERP_CLOSE_THRESHOLD) / (LERP_FAR_THRESHOLD - LERP_CLOSE_THRESHOLD);
    return HANDLE_LERP_MAX - t * (HANDLE_LERP_MAX - HANDLE_LERP_MIN);
  }, []);

  // Animation function for smooth handle movement
  const animateHandle = useCallback(() => {
    let needsAnimation = false;

    // Update tick
    if (internalTickRef.current !== undefined && targetTickRef.current !== undefined) {
      const current = internalTickRef.current;
      const target = targetTickRef.current;
      const diff = target - current;

      if (Math.abs(diff) >= 1) {
        needsAnimation = true;
        const lerpFactor = getDynamicLerp(diff);
        const lerpMovement = diff * lerpFactor;
        const cappedMovement = Math.sign(lerpMovement) * Math.min(Math.abs(lerpMovement), MAX_TICK_SPEED);
        const newValue = current + cappedMovement;
        internalTickRef.current = newValue;
        setInternalTick(newValue);
      } else if (current !== target) {
        internalTickRef.current = target;
        setInternalTick(target);
      }
    }

    if (needsAnimation) {
      animationRef.current = requestAnimationFrame(animateHandle);
    } else {
      animationRef.current = null;
    }
  }, [getDynamicLerp]);

  // Start animation if not already running
  const startAnimation = useCallback(() => {
    if (!animationRef.current) {
      animationRef.current = requestAnimationFrame(animateHandle);
    }
  }, [animateHandle]);

  // Sync internal state with props when not dragging
  useEffect(() => {
    if (!isDragging) {
      targetTickRef.current = priceTick;
      internalTickRef.current = priceTick;
      setInternalTick(priceTick);
    }
  }, [priceTick, isDragging]);

  // Smooth update function - set target and start animation
  const debouncedSetTick = useCallback(
    (tick: number) => {
      targetTickRef.current = tick;
      startAnimation();

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setPriceTick(tick);
      }, DEBOUNCE_DELAY);
    },
    [setPriceTick, startAnimation],
  );

  // Flush debounced values immediately
  const flushDebouncedValues = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Set final value from target
    const finalTick = targetTickRef.current;

    if (finalTick !== undefined && finalTick !== priceTick) {
      setPriceTick(finalTick);
      internalTickRef.current = finalTick;
      setInternalTick(finalTick);
    }

    // Stop animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [priceTick, setPriceTick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Get target tick (what user actually wants, not the animated value)
  const getTargetTick = useCallback(() => {
    return targetTickRef.current;
  }, []);

  return {
    internalTick,
    debouncedSetTick,
    flushDebouncedValues,
    getTargetTick,
  };
};
