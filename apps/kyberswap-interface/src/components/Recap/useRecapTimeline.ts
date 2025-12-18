import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { PART_DURATIONS, PART_SCENES, Scene, TIMELINE } from 'components/Recap/types'

// Part start times in ms
const PART_START_TIMES = {
  1: 0,
  2: PART_DURATIONS.PART1,
  3: PART_DURATIONS.PART1 + PART_DURATIONS.PART2,
  4: PART_DURATIONS.PART1 + PART_DURATIONS.PART2 + PART_DURATIONS.PART3,
  5: PART_DURATIONS.PART1 + PART_DURATIONS.PART2 + PART_DURATIONS.PART3 + PART_DURATIONS.PART4,
} as const

interface UseRecapTimelineReturn {
  scene: Scene
  elapsedTime: number
  currentPart: 1 | 2 | 3 | 4 | 5
  partProgress: {
    part1: number
    part2: number
    part3: number
    part4: number
    part5: number
  }
  sceneFlags: {
    isFireworkScene: boolean
    isVideoScene: boolean
    isStarsScene: boolean
    isSmarterFinaleScene: boolean
    isSummaryScene: boolean
    isMarkScene: boolean
    isTradingStatsScene: boolean
    isTopPercentScene: boolean
    isBadgeScene: boolean
    isCapitalFlowScene: boolean
    isTopChainsScene: boolean
    isTopTokensScene: boolean
    isMevBotsScene: boolean
    isMevFlowScene: boolean
    isFairflowRewardsScene: boolean
    isLiquiditySmarterScene: boolean
  }
  isPaused: boolean
  togglePause: () => void
  goToNextPart: () => void
  goToPrevPart: () => void
}

export default function useRecapTimeline(): UseRecapTimelineReturn {
  const [scene, setScene] = useState<Scene>('firework-2025')
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [isPaused, setIsPaused] = useState(false)

  // Refs for tracking time
  const elapsedTimeRef = useRef<number>(0)
  const pausedAtElapsedRef = useRef<number>(0)
  const lastUpdateTimeRef = useRef<number>(Date.now())
  const timersRef = useRef<NodeJS.Timeout[]>([])

  // Keep elapsedTimeRef in sync
  useEffect(() => {
    elapsedTimeRef.current = elapsedTime
  }, [elapsedTime])

  // Helper to reschedule timers from a given elapsed time
  const rescheduleTimers = useCallback((fromElapsed: number) => {
    // Clear existing timers
    timersRef.current.forEach(timer => clearTimeout(timer))
    timersRef.current = []

    // Find and set the correct scene for current elapsed time
    let currentScene: Scene = 'firework-2025'
    for (let i = TIMELINE.length - 1; i >= 0; i--) {
      if (fromElapsed >= TIMELINE[i].delay) {
        currentScene = TIMELINE[i].scene
        break
      }
    }
    setScene(currentScene)

    // Schedule future scenes
    TIMELINE.forEach(({ scene: nextScene, delay }) => {
      const remainingDelay = delay - fromElapsed
      if (remainingDelay > 0) {
        const timer = setTimeout(() => {
          setScene(nextScene)
        }, remainingDelay)
        timersRef.current.push(timer)
      }
    })
  }, [])

  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      if (!prev) {
        // Pausing - save current elapsed time
        pausedAtElapsedRef.current = elapsedTimeRef.current
        // Clear all pending timers
        timersRef.current.forEach(timer => clearTimeout(timer))
        timersRef.current = []
      } else {
        // Resuming - reset last update time to now
        lastUpdateTimeRef.current = Date.now()
        rescheduleTimers(pausedAtElapsedRef.current)
      }
      return !prev
    })
  }, [rescheduleTimers])

  const goToNextPart = useCallback(() => {
    const current = elapsedTimeRef.current
    let targetTime = current

    // Find next part start time
    if (current < PART_START_TIMES[2]) {
      targetTime = PART_START_TIMES[2]
    } else if (current < PART_START_TIMES[3]) {
      targetTime = PART_START_TIMES[3]
    } else if (current < PART_START_TIMES[4]) {
      targetTime = PART_START_TIMES[4]
    } else if (current < PART_START_TIMES[5]) {
      targetTime = PART_START_TIMES[5]
    }

    if (targetTime !== current) {
      setElapsedTime(targetTime)
      elapsedTimeRef.current = targetTime
      pausedAtElapsedRef.current = targetTime
      lastUpdateTimeRef.current = Date.now()
      rescheduleTimers(targetTime)
    }
  }, [rescheduleTimers])

  const goToPrevPart = useCallback(() => {
    const current = elapsedTimeRef.current
    let targetTime = 0

    // Find previous part start time
    if (current >= PART_START_TIMES[5]) {
      targetTime = PART_START_TIMES[4]
    } else if (current >= PART_START_TIMES[4]) {
      targetTime = PART_START_TIMES[3]
    } else if (current >= PART_START_TIMES[3]) {
      targetTime = PART_START_TIMES[2]
    } else if (current >= PART_START_TIMES[2]) {
      targetTime = PART_START_TIMES[1]
    }

    setElapsedTime(targetTime)
    elapsedTimeRef.current = targetTime
    pausedAtElapsedRef.current = targetTime
    lastUpdateTimeRef.current = Date.now()
    rescheduleTimers(targetTime)
  }, [rescheduleTimers])

  // Setup timeline transitions
  useEffect(() => {
    timersRef.current = TIMELINE.map(({ scene: nextScene, delay }) =>
      setTimeout(() => {
        setScene(nextScene)
      }, delay),
    )

    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer))
    }
  }, [])

  // Update elapsed time
  useEffect(() => {
    if (isPaused) return

    let animationFrameId: number

    const updateTime = () => {
      const now = Date.now()
      const delta = now - lastUpdateTimeRef.current
      lastUpdateTimeRef.current = now

      setElapsedTime(prev => prev + delta)
      animationFrameId = requestAnimationFrame(updateTime)
    }

    // Initialize lastUpdateTimeRef when starting/resuming
    lastUpdateTimeRef.current = Date.now()

    animationFrameId = requestAnimationFrame(updateTime)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isPaused])

  // Memoize current part calculation
  const currentPart = useMemo((): 1 | 2 | 3 | 4 | 5 => {
    if (PART_SCENES.PART1.includes(scene)) return 1
    if (PART_SCENES.PART2.includes(scene)) return 2
    if (PART_SCENES.PART3.includes(scene)) return 3
    if (PART_SCENES.PART4.includes(scene)) return 4
    return 5
  }, [scene])

  // Memoize progress calculations
  const partProgress = useMemo(() => {
    const { PART1, PART2, PART3, PART4, PART5 } = PART_DURATIONS

    const part1 = Math.min(elapsedTime / PART1, 1)
    const part2 = elapsedTime > PART1 ? Math.min((elapsedTime - PART1) / PART2, 1) : 0
    const part3 = elapsedTime > PART1 + PART2 ? Math.min((elapsedTime - PART1 - PART2) / PART3, 1) : 0
    const part4 = elapsedTime > PART1 + PART2 + PART3 ? Math.min((elapsedTime - PART1 - PART2 - PART3) / PART4, 1) : 0
    const part5Start = PART1 + PART2 + PART3 + PART4
    const part5 = elapsedTime > part5Start ? Math.min((elapsedTime - part5Start) / PART5, 1) : 0

    return { part1, part2, part3, part4, part5 }
  }, [elapsedTime])

  // Memoize scene flags
  const sceneFlags = useMemo(
    () => ({
      isFireworkScene: scene === 'firework-2025' || scene === 'year-of-flow',
      isVideoScene: scene.startsWith('video-'),
      isStarsScene:
        scene === 'stars-stats' ||
        scene === 'capital-flow' ||
        scene === 'top-chains' ||
        scene === 'top-tokens' ||
        scene === 'summary',
      isSmarterFinaleScene: scene === 'smarter-finale',
      isSummaryScene: scene === 'summary',
      isMarkScene: scene === 'mark-on-market',
      isTradingStatsScene: scene === 'trading-stats',
      isTopPercentScene: scene === 'top-percent',
      isBadgeScene: scene === 'badge',
      isCapitalFlowScene: scene === 'capital-flow',
      isTopChainsScene: scene === 'top-chains',
      isTopTokensScene: scene === 'top-tokens',
      isMevBotsScene: scene === 'mev-bots',
      isMevFlowScene: scene === 'mev-flow',
      isFairflowRewardsScene: scene === 'fairflow-rewards',
      isLiquiditySmarterScene: scene === 'liquidity-smarter',
    }),
    [scene],
  )

  return {
    scene,
    elapsedTime,
    currentPart,
    partProgress,
    sceneFlags,
    isPaused,
    togglePause,
    goToNextPart,
    goToPrevPart,
  }
}
