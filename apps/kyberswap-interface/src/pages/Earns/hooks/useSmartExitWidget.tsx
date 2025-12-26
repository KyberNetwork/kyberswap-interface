import { ReactElement, useState } from 'react'

import { SmartExit } from 'pages/Earns/components/SmartExit'
import { ParsedPosition } from 'pages/Earns/types'

/**
 * Custom hook to manage Smart Exit widget state and rendering
 * @returns Object containing smartExitPosition, onOpenSmartExit callback, and smartExitWidget JSX
 */
export default function useSmartExitWidget(): {
  smartExitPosition: ParsedPosition | null
  onOpenSmartExit: (position: ParsedPosition | undefined) => void
  smartExitWidget: ReactElement | null
} {
  const [smartExitPosition, setSmartExitPosition] = useState<ParsedPosition | null>(null)

  const onOpenSmartExit = (position: ParsedPosition | undefined) => {
    setSmartExitPosition(position ?? null)
  }

  const smartExitWidget = smartExitPosition ? (
    <SmartExit position={smartExitPosition} onDismiss={() => setSmartExitPosition(null)} />
  ) : null

  return {
    smartExitPosition,
    onOpenSmartExit,
    smartExitWidget,
  }
}
