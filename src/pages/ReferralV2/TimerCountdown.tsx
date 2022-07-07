import React, { useEffect, useState } from 'react'
import { addSeconds, format } from 'date-fns'
export default function TimerCountdown({
  durationInSeconds = 10,
  onExpired,
}: {
  durationInSeconds?: number
  onExpired?: () => void
}) {
  const [secondsFromStart, setSecondsFromStart] = useState(0)
  const [startTime, setStartTime] = useState(Date.now().toString())
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now().toString()
      const diffSeconds = Math.floor((parseInt(currentTime) - parseInt(startTime)) / 1000)
      if (diffSeconds > durationInSeconds) {
        onExpired && onExpired()
        setSecondsFromStart(0)
        setStartTime(currentTime)
      } else {
        setSecondsFromStart(diffSeconds)
      }
    }, 1000)

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [startTime])

  return <span>{format(addSeconds(new Date(0), durationInSeconds - secondsFromStart), 'mm:ss')}</span>
}
