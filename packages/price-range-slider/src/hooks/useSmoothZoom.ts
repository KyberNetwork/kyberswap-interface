import { Dispatch, SetStateAction, useCallback, useEffect, useRef } from 'react';

import { ZOOM_DURATION } from '@/constants';
import type { ViewRange } from '@/types';

/** Easing function: ease-out cubic for smooth deceleration */
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

/**
 * Hook for smooth zoom animation using easing function
 * Uses ease-out for natural deceleration feel
 */
export const useSmoothZoom = (
  viewRange: ViewRange | null,
  setViewRange: Dispatch<SetStateAction<ViewRange | null>>,
) => {
  const zoomAnimationRef = useRef<number | null>(null);
  const targetViewRangeRef = useRef<ViewRange | null>(null);
  const startViewRangeRef = useRef<ViewRange | null>(null);
  const startTimeRef = useRef<number>(0);

  const animateZoom = useCallback(() => {
    if (!targetViewRangeRef.current || !startViewRangeRef.current) {
      zoomAnimationRef.current = null;
      return;
    }

    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    const progress = Math.min(elapsed / ZOOM_DURATION, 1);
    const easedProgress = easeOutCubic(progress);

    const start = startViewRangeRef.current;
    const target = targetViewRangeRef.current;

    const newMin = start.min + (target.min - start.min) * easedProgress;
    const newMax = start.max + (target.max - start.max) * easedProgress;

    setViewRange({ min: newMin, max: newMax });

    if (progress < 1) {
      // Continue animation
      zoomAnimationRef.current = requestAnimationFrame(animateZoom);
    } else {
      // Animation complete - set exact target values
      setViewRange(target);
      targetViewRangeRef.current = null;
      startViewRangeRef.current = null;
      zoomAnimationRef.current = null;
    }
  }, [setViewRange]);

  const startSmoothZoom = useCallback(
    (targetMin: number, targetMax: number) => {
      // If already animating, use current position as new start
      if (zoomAnimationRef.current && viewRange) {
        startViewRangeRef.current = viewRange;
      } else if (viewRange) {
        startViewRangeRef.current = viewRange;
      }

      targetViewRangeRef.current = { min: targetMin, max: targetMax };
      startTimeRef.current = performance.now();

      if (!zoomAnimationRef.current) {
        zoomAnimationRef.current = requestAnimationFrame(animateZoom);
      }
    },
    [animateZoom, viewRange],
  );

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (zoomAnimationRef.current) {
        cancelAnimationFrame(zoomAnimationRef.current);
      }
    };
  }, []);

  return { startSmoothZoom };
};
