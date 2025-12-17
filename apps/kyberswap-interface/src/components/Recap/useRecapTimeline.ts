import { useEffect, useMemo, useRef, useState } from 'react'

import { PART_DURATIONS, PART_SCENES, Scene, TIMELINE } from 'components/Recap/types'

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
}

export default function useRecapTimeline(): UseRecapTimelineReturn {
  const [scene, setScene] = useState<Scene>('firework-2025')
  const startTimeRef = useRef<number>(Date.now())
  const [elapsedTime, setElapsedTime] = useState<number>(0)

  // Setup timeline transitions
  useEffect(() => {
    const timers = TIMELINE.map(({ scene: nextScene, delay }) =>
      setTimeout(() => {
        setScene(nextScene)
      }, delay),
    )

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [])

  // Update elapsed time with requestAnimationFrame for better performance
  useEffect(() => {
    let animationFrameId: number

    const updateTime = () => {
      setElapsedTime(Date.now() - startTimeRef.current)
      animationFrameId = requestAnimationFrame(updateTime)
    }

    // Start with a slower interval initially, then switch to RAF
    const initialInterval = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current)
    }, 100)

    // After 500ms, switch to RAF for smoother animation
    const rafTimeout = setTimeout(() => {
      clearInterval(initialInterval)
      animationFrameId = requestAnimationFrame(updateTime)
    }, 500)

    return () => {
      clearInterval(initialInterval)
      clearTimeout(rafTimeout)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [])

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
        scene === 'mark-on-market' ||
        scene === 'trading-stats' ||
        scene === 'top-percent' ||
        scene === 'badge' ||
        scene === 'capital-flow' ||
        scene === 'top-chains' ||
        scene === 'top-tokens' ||
        scene === 'mev-bots' ||
        scene === 'mev-flow' ||
        scene === 'fairflow-rewards' ||
        scene === 'liquidity-smarter' ||
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
  }
}
