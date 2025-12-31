import { useMemo } from 'react'

import { EXPIRE_TIME_PRESETS } from 'pages/Earns/components/SmartExit/constants'

/**
 * Custom hook to calculate deadline from expire time
 * Handles conversion from relative time (seconds) to absolute timestamp
 */
export const useSmartExitDeadline = (expireTime: number) => {
  const deadline = useMemo(() => {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // Check if expireTime is a preset value (relative time in seconds)
    const isPresetTime = [
      EXPIRE_TIME_PRESETS.SEVEN_DAYS,
      EXPIRE_TIME_PRESETS.THIRTY_DAYS,
      EXPIRE_TIME_PRESETS.NINETY_DAYS,
      EXPIRE_TIME_PRESETS.FOREVER,
    ].includes(expireTime)

    // If it's a preset, convert to absolute timestamp
    // Otherwise, assume it's already an absolute timestamp (milliseconds)
    const time = isPresetTime ? Math.floor(today.getTime()) + expireTime * 1000 : expireTime

    // Convert to seconds (Unix timestamp)
    return Math.floor(time / 1000)
  }, [expireTime])

  return deadline
}
