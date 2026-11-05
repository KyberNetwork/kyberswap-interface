import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { TAB } from 'pages/Swap/layout/Tabs'

const ENABLE_DEGEN_MODE_PARAM = 'enableDegenMode'
const HIGHLIGHT_DURATION = 4_000

export const useRequiredDegenMode = ({
  setActiveTab,
  syncTabWithUrl = false,
}: {
  syncTabWithUrl?: boolean
  setActiveTab: (tab: TAB) => void
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const shouldOpenSettings = searchParams.get(ENABLE_DEGEN_MODE_PARAM) === 'true'
  const [highlightDegenMode, setHighlightDegenMode] = useState(false)

  useEffect(() => {
    if (!shouldOpenSettings) return

    if (!syncTabWithUrl) setActiveTab(TAB.SETTINGS)
    setHighlightDegenMode(true)

    setSearchParams(
      prev => {
        const nextSearchParams = new URLSearchParams(prev)
        nextSearchParams.delete(ENABLE_DEGEN_MODE_PARAM)
        if (syncTabWithUrl) nextSearchParams.set('tab', TAB.SETTINGS)
        return nextSearchParams
      },
      { replace: true },
    )
  }, [shouldOpenSettings, setActiveTab, setSearchParams, syncTabWithUrl])

  useEffect(() => {
    if (!highlightDegenMode) return

    const timeout = setTimeout(() => setHighlightDegenMode(false), HIGHLIGHT_DURATION)
    return () => clearTimeout(timeout)
  }, [highlightDegenMode])

  return highlightDegenMode
}
