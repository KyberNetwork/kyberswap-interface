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
  goToPartStart: (part?: 1 | 2 | 3 | 4 | 5) => void
}

interface UseRecapTimelineOptions {
  skipPart4?: boolean
}

export default function useRecapTimeline(options: UseRecapTimelineOptions = {}): UseRecapTimelineReturn {
  const { skipPart4 = false } = options
  const [scene, setScene] = useState<Scene>('firework-2025')
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [isPaused, setIsPaused] = useState(false)

  // Refs for tracking time
  const elapsedTimeRef = useRef<number>(0)
  const pausedAtElapsedRef = useRef<number>(0)
  const lastUpdateTimeRef = useRef<number>(Date.now())
  const timersRef = useRef<NodeJS.Timeout[]>([])
  const skipPart4Ref = useRef(skipPart4)

  // Keep elapsedTimeRef in sync
  useEffect(() => {
    elapsedTimeRef.current = elapsedTime
  }, [elapsedTime])

  const partDurations = useMemo(() => {
    if (!skipPart4) {
      return [
        PART_DURATIONS.PART1,
        PART_DURATIONS.PART2,
        PART_DURATIONS.PART3,
        PART_DURATIONS.PART4,
        PART_DURATIONS.PART5,
      ]
    }
    return [PART_DURATIONS.PART1, PART_DURATIONS.PART2, PART_DURATIONS.PART3, PART_DURATIONS.PART5]
  }, [skipPart4])

  const partStartTimes = useMemo(() => {
    const starts: number[] = []
    let acc = 0
    partDurations.forEach(duration => {
      starts.push(acc)
      acc += duration
    })
    return starts
  }, [partDurations])

  const effectiveTimeline = useMemo(() => {
    if (!skipPart4) return TIMELINE
    return TIMELINE.filter(({ scene: timelineScene }) => !PART_SCENES.PART4.includes(timelineScene)).map(item => {
      if (item.scene === 'summary') {
        return { ...item, delay: item.delay - PART_DURATIONS.PART4 }
      }
      return item
    })
  }, [skipPart4])

  // Helper to reschedule timers from a given elapsed time
  const rescheduleTimers = useCallback(
    (fromElapsed: number) => {
      // Clear existing timers
      timersRef.current.forEach(timer => clearTimeout(timer))
      timersRef.current = []

      // Find and set the correct scene for current elapsed time
      let currentScene: Scene = 'firework-2025'
      for (let i = effectiveTimeline.length - 1; i >= 0; i--) {
        if (fromElapsed >= effectiveTimeline[i].delay) {
          currentScene = effectiveTimeline[i].scene
          break
        }
      }
      setScene(currentScene)

      // Schedule future scenes
      effectiveTimeline.forEach(({ scene: nextScene, delay }) => {
        const remainingDelay = delay - fromElapsed
        if (remainingDelay > 0) {
          const timer = setTimeout(() => {
            setScene(nextScene)
          }, remainingDelay)
          timersRef.current.push(timer)
        }
      })
    },
    [effectiveTimeline],
  )

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

  const jumpToTime = useCallback(
    (targetTime: number) => {
      setElapsedTime(targetTime)
      elapsedTimeRef.current = targetTime
      pausedAtElapsedRef.current = targetTime
      lastUpdateTimeRef.current = Date.now()
      rescheduleTimers(targetTime)
    },
    [rescheduleTimers],
  )

  const goToNextPart = useCallback(() => {
    const current = elapsedTimeRef.current
    let targetTime = current

    // Find next part start time
    for (let i = 1; i < partStartTimes.length; i++) {
      if (current < partStartTimes[i]) {
        targetTime = partStartTimes[i]
        break
      }
    }

    if (targetTime !== current) {
      jumpToTime(targetTime)
    }
  }, [jumpToTime, partStartTimes])

  const goToPrevPart = useCallback(() => {
    const current = elapsedTimeRef.current
    let targetTime = 0

    // Find previous part start time
    for (let i = partStartTimes.length - 1; i >= 0; i--) {
      if (current >= partStartTimes[i]) {
        targetTime = partStartTimes[i === 0 ? 0 : i - 1]
        break
      }
    }

    jumpToTime(targetTime)
  }, [jumpToTime, partStartTimes])

  // Memoize current part calculation
  const currentPart = useMemo((): 1 | 2 | 3 | 4 | 5 => {
    if (PART_SCENES.PART1.includes(scene)) return 1
    if (PART_SCENES.PART2.includes(scene)) return 2
    if (PART_SCENES.PART3.includes(scene)) return 3
    if (skipPart4 && PART_SCENES.PART5.includes(scene)) return 4
    if (PART_SCENES.PART4.includes(scene)) return 4
    return 5
  }, [scene, skipPart4])

  const goToPartStart = useCallback(
    (part?: 1 | 2 | 3 | 4 | 5) => {
      const targetPart = part ?? currentPart
      const targetIndex = Math.min(targetPart, partStartTimes.length) - 1
      const targetTime = partStartTimes[targetIndex]
      if (targetTime !== elapsedTimeRef.current) {
        jumpToTime(targetTime)
      }
    },
    [currentPart, jumpToTime, partStartTimes],
  )

  // Setup timeline transitions
  useEffect(() => {
    rescheduleTimers(elapsedTimeRef.current)

    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer))
      timersRef.current = []
    }
  }, [rescheduleTimers])

  useEffect(() => {
    if (skipPart4 && !skipPart4Ref.current) {
      const skippedStart = PART_START_TIMES[4]
      if (elapsedTimeRef.current >= skippedStart) {
        const adjustedTime = elapsedTimeRef.current - PART_DURATIONS.PART4
        jumpToTime(adjustedTime)
      }
    }
    skipPart4Ref.current = skipPart4
  }, [jumpToTime, skipPart4])

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

  // Memoize progress calculations
  const partProgress = useMemo(() => {
    const progress = partDurations.map((duration, index) => {
      const start = partStartTimes[index]
      return elapsedTime > start ? Math.min((elapsedTime - start) / duration, 1) : 0
    })

    const part1 = progress[0] ?? 0
    const part2 = progress[1] ?? 0
    const part3 = progress[2] ?? 0
    const part4 = progress[3] ?? 0
    const part5 = skipPart4 ? 0 : progress[4] ?? 0

    return { part1, part2, part3, part4, part5 }
  }, [elapsedTime, partDurations, partStartTimes, skipPart4])

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
    goToPartStart,
  }
}
