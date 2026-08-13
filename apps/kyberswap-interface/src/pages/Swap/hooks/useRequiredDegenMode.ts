import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const ENABLE_DEGEN_MODE_PARAM = 'enableDegenMode'
const HIGHLIGHT_DURATION = 4_000
const DEFAULT_SETTINGS_TAB = 'settings'

export const useRequiredDegenMode = <Tab>({
  settingsTab = DEFAULT_SETTINGS_TAB as Tab,
  setActiveTab,
}: {
  settingsTab?: Tab
  setActiveTab: (tab: Tab) => void
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const shouldOpenSettings = searchParams.get(ENABLE_DEGEN_MODE_PARAM) === 'true'
  const [highlightDegenMode, setHighlightDegenMode] = useState(false)

  useEffect(() => {
    if (!shouldOpenSettings) return

    setActiveTab(settingsTab)
    setHighlightDegenMode(true)

    setSearchParams(
      prev => {
        const nextSearchParams = new URLSearchParams(prev)
        nextSearchParams.delete(ENABLE_DEGEN_MODE_PARAM)
        return nextSearchParams
      },
      { replace: true },
    )
  }, [shouldOpenSettings, setActiveTab, setSearchParams, settingsTab])

  useEffect(() => {
    if (!highlightDegenMode) return

    const timeout = setTimeout(() => setHighlightDegenMode(false), HIGHLIGHT_DURATION)
    return () => clearTimeout(timeout)
  }, [highlightDegenMode])

  return highlightDegenMode
}
