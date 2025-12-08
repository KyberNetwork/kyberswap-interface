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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // Target ticks (where user wants to go)
  const targetLowerTickRef = useRef<number | undefined>(lowerTick);
  const targetUpperTickRef = useRef<number | undefined>(upperTick);

  // Current internal tick values (tracked via refs for animation loop)
  const internalLowerRef = useRef<number | undefined>(lowerTick);
  const internalUpperRef = useRef<number | undefined>(upperTick);

  // Internal tick state for React rendering
  const [internalLowerTick, setInternalLowerTick] = useState<number | undefined>(lowerTick);
  const [internalUpperTick, setInternalUpperTick] = useState<number | undefined>(upperTick);

  // Helper: calculate dynamic lerp factor based on distance
  const getDynamicLerp = useCallback((diff: number): number => {
    const absDiff = Math.abs(diff);
    if (absDiff > LERP_FAR_THRESHOLD) return HANDLE_LERP_MIN;
    if (absDiff < LERP_CLOSE_THRESHOLD) return HANDLE_LERP_MAX;
    const t = (absDiff - LERP_CLOSE_THRESHOLD) / (LERP_FAR_THRESHOLD - LERP_CLOSE_THRESHOLD);
    return HANDLE_LERP_MAX - t * (HANDLE_LERP_MAX - HANDLE_LERP_MIN);
  }, []);

  // Animation function for smooth handle movement
  const animateHandles = useCallback(() => {
    let needsAnimation = false;

    // Update lower tick
    if (internalLowerRef.current !== undefined && targetLowerTickRef.current !== undefined) {
      const current = internalLowerRef.current;
      const target = targetLowerTickRef.current;
      const diff = target - current;

      if (Math.abs(diff) >= 1) {
        needsAnimation = true;
        const lerpFactor = getDynamicLerp(diff);
        const lerpMovement = diff * lerpFactor;
        const cappedMovement = Math.sign(lerpMovement) * Math.min(Math.abs(lerpMovement), MAX_TICK_SPEED);
        const newValue = current + cappedMovement;
        internalLowerRef.current = newValue;
        setInternalLowerTick(newValue);
      } else if (current !== target) {
        internalLowerRef.current = target;
        setInternalLowerTick(target);
      }
    }

    // Update upper tick
    if (internalUpperRef.current !== undefined && targetUpperTickRef.current !== undefined) {
      const current = internalUpperRef.current;
      const target = targetUpperTickRef.current;
      const diff = target - current;

      if (Math.abs(diff) >= 1) {
        needsAnimation = true;
        const lerpFactor = getDynamicLerp(diff);
        const lerpMovement = diff * lerpFactor;
        const cappedMovement = Math.sign(lerpMovement) * Math.min(Math.abs(lerpMovement), MAX_TICK_SPEED);
        const newValue = current + cappedMovement;
        internalUpperRef.current = newValue;
        setInternalUpperTick(newValue);
      } else if (current !== target) {
        internalUpperRef.current = target;
        setInternalUpperTick(target);
      }
    }

    if (needsAnimation) {
      animationRef.current = requestAnimationFrame(animateHandles);
    } else {
      animationRef.current = null;
    }
  }, [getDynamicLerp]);

  // Start animation if not already running
  const startAnimation = useCallback(() => {
    if (!animationRef.current) {
      animationRef.current = requestAnimationFrame(animateHandles);
    }
  }, [animateHandles]);

  // Sync internal state with props when not dragging
  useEffect(() => {
    if (!isDragging) {
      targetLowerTickRef.current = lowerTick;
      targetUpperTickRef.current = upperTick;
      internalLowerRef.current = lowerTick;
      internalUpperRef.current = upperTick;
      setInternalLowerTick(lowerTick);
      setInternalUpperTick(upperTick);
    }
  }, [lowerTick, upperTick, isDragging]);

  // Smooth update functions - set target and start animation
  const debouncedSetLowerTick = useCallback(
    (tick: number) => {
      targetLowerTickRef.current = tick;
      startAnimation();

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setLowerTick(tick);
      }, DEBOUNCE_DELAY);
    },
    [setLowerTick, startAnimation],
  );

  const debouncedSetUpperTick = useCallback(
    (tick: number) => {
      targetUpperTickRef.current = tick;
      startAnimation();

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setUpperTick(tick);
      }, DEBOUNCE_DELAY);
    },
    [setUpperTick, startAnimation],
  );

  // Flush debounced values immediately
  const flushDebouncedValues = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Set final values from targets
    const finalLower = targetLowerTickRef.current;
    const finalUpper = targetUpperTickRef.current;

    if (finalLower !== undefined && finalLower !== lowerTick) {
      setLowerTick(finalLower);
      internalLowerRef.current = finalLower;
      setInternalLowerTick(finalLower);
    }
    if (finalUpper !== undefined && finalUpper !== upperTick) {
      setUpperTick(finalUpper);
      internalUpperRef.current = finalUpper;
      setInternalUpperTick(finalUpper);
    }

    // Stop animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [lowerTick, upperTick, setLowerTick, setUpperTick]);

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

  // Get target ticks (what user actually wants, not the animated value)
  const getTargetTicks = useCallback(() => {
    return {
      lowerTick: targetLowerTickRef.current,
      upperTick: targetUpperTickRef.current,
    };
  }, []);

  return {
    internalLowerTick,
    internalUpperTick,
    debouncedSetLowerTick,
    debouncedSetUpperTick,
    flushDebouncedValues,
    getTargetTicks,
  };
};
