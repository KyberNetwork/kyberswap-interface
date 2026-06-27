import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const ENABLE_DEGEN_MODE_PARAM = 'enableDegenMode'
const HIGHLIGHT_DURATION = 4_000
const DEFAULT_SETTINGS_TAB = 'settings'

/**
 * When the user lands with `?enableDegenMode=true` (e.g. via the "Swap Anyway" button),
 * open the settings tab once and flash the Degen Mode row.
 *
 * The URL param is cleared immediately after opening so it only forces the tab a single time —
 * otherwise the effect would keep snapping the tab back to settings while the param lived,
 * blocking the back button. The flash is driven by internal state instead, decoupled from the param.
 *
 * Returns whether the Degen Mode row should currently be highlighted.
 */
export default function useRequiredDegenMode<Tab>({
  settingsTab = DEFAULT_SETTINGS_TAB as Tab,
  setActiveTab,
}: {
  settingsTab?: Tab
  setActiveTab: (tab: Tab) => void
}) {
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
