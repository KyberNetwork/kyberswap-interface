import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { getFeeYieldCondition, getTimeCondition } from 'pages/Earns/components/SmartExit/utils'
import { Metric, SelectedMetric } from 'pages/Earns/types'

export {
  HighlightWrapper,
  InlineHighlightWrapper,
} from 'pages/Earns/components/SmartExit/GuidedHighlight/HighlightWrapper'

export type HighlightStep = 'metric-select' | 'metric-input' | 'both' | 'none'

interface GuidedHighlightContextValue {
  currentStep: HighlightStep
  isHighlightEnabled: boolean
  dismissHighlight: () => void
  animationKey: number
}

const GuidedHighlightContext = createContext<GuidedHighlightContextValue>({
  currentStep: 'none',
  isHighlightEnabled: false,
  dismissHighlight: () => {},
  animationKey: 0,
})

export const useGuidedHighlight = () => useContext(GuidedHighlightContext)

/**
 * Check if a metric condition has been filled by user (not default value)
 */
function isConditionFilled(metric: SelectedMetric | null): boolean {
  if (!metric) return false

  switch (metric.metric) {
    case Metric.FeeYield: {
      const condition = getFeeYieldCondition(metric)
      // FeeYield default is empty, so any value means user filled it
      return condition !== null && condition !== ''
    }
    case Metric.PoolPrice: {
      // PoolPrice always has a default value, so we can't detect when user "fills" it.
      // Return false to keep the highlight active until user switches to another metric type
      // and fills that condition, or dismisses the highlight naturally.
      return false
    }
    case Metric.Time: {
      const condition = getTimeCondition(metric)
      // Time default is null, so any value means user filled it
      return condition !== null && condition.time !== null
    }
    default:
      return false
  }
}

interface GuidedHighlightProviderProps {
  children: React.ReactNode
  selectedMetrics: Array<SelectedMetric | null>
}

export const GuidedHighlightProvider = ({ children, selectedMetrics }: GuidedHighlightProviderProps) => {
  // Always enable highlight when modal opens
  const [isHighlightEnabled, setIsHighlightEnabled] = useState(true)
  const [hasUserFilledCondition, setHasUserFilledCondition] = useState(false)

  // Track metric changes to re-trigger animation
  const prevMetricRef = useRef<Metric | null>(null)
  const [animationKey, setAnimationKey] = useState(0)

  // Track metric changes and condition fills
  useEffect(() => {
    if (!isHighlightEnabled || hasUserFilledCondition) return

    const [metric1] = selectedMetrics
    if (!metric1) return

    // When metric type changes, re-trigger animation
    if (prevMetricRef.current !== null && prevMetricRef.current !== metric1.metric) {
      setAnimationKey(prev => prev + 1)
    }
    prevMetricRef.current = metric1.metric

    // Check if user filled the condition
    if (isConditionFilled(metric1)) {
      setHasUserFilledCondition(true)
    }
  }, [selectedMetrics, isHighlightEnabled, hasUserFilledCondition])

  const dismissHighlight = useCallback(() => {
    setHasUserFilledCondition(true)
    setIsHighlightEnabled(false)
  }, [])

  const currentStep = useMemo((): HighlightStep => {
    if (!isHighlightEnabled || hasUserFilledCondition) return 'none'

    const [metric1] = selectedMetrics

    // If no metric selected yet, highlight the dropdown
    if (!metric1) {
      return 'metric-select'
    }

    // Show both highlights until user fills condition
    return 'both'
  }, [isHighlightEnabled, hasUserFilledCondition, selectedMetrics])

  const value = useMemo(
    () => ({
      currentStep,
      isHighlightEnabled,
      dismissHighlight,
      // Include animationKey to allow components to re-trigger animation
      animationKey,
    }),
    [currentStep, isHighlightEnabled, dismissHighlight, animationKey],
  )

  return <GuidedHighlightContext.Provider value={value}>{children}</GuidedHighlightContext.Provider>
}
