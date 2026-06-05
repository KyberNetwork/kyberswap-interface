import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

const ENABLE_DEGEN_MODE_PARAM = 'enableDegenMode'
const HIGHLIGHT_DURATION = 4_000
const DEFAULT_SETTINGS_TAB = 'settings'

export default function useRequiredDegenMode<Tab>({
  activeTab,
  settingsTab = DEFAULT_SETTINGS_TAB as Tab,
  setActiveTab,
}: {
  activeTab: Tab
  settingsTab?: Tab
  setActiveTab: (tab: Tab) => void
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const shouldOpenSettings = searchParams.get(ENABLE_DEGEN_MODE_PARAM) === 'true'

  useEffect(() => {
    if (!shouldOpenSettings) return

    if (activeTab !== settingsTab) {
      setActiveTab(settingsTab)
    }

    const timeout = setTimeout(() => {
      setSearchParams(prev => {
        const nextSearchParams = new URLSearchParams(prev)
        nextSearchParams.delete(ENABLE_DEGEN_MODE_PARAM)
        return nextSearchParams
      })
    }, HIGHLIGHT_DURATION)

    return () => clearTimeout(timeout)
  }, [activeTab, searchParams, setActiveTab, setSearchParams, settingsTab, shouldOpenSettings])
}
