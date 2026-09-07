import { useEffect, useState } from 'react'
import { Clock } from 'react-feather'

import { cn } from 'utils/cn'

export default function TimerCountdown({
  endTime,
  maxLength = Number.MAX_SAFE_INTEGER,
  className,
}: {
  endTime: number
  maxLength?: number
  className?: string
}) {
  const [timeString, setTimeString] = useState<string>('--')

  useEffect(() => {
    const calculate = () => {
      const seconds = endTime - Math.floor(Date.now() / 1000)
      if (seconds < 0) return setTimeString('')
      if (seconds < 60) return setTimeString(Math.floor(seconds) + 's')

      const levels = [
        [Math.floor(seconds / 31536000), 'years'],
        [Math.floor((seconds % 31536000) / 86400), ' days'],
        [Math.floor((seconds % 86400) / 3600), 'h'],
        [Math.floor((seconds % 3600) / 60), 'm'],
        [seconds % 60, 's'],
      ]

      const texts: string[] = []
      let hideZero = true
      for (let i = 0, count = 0; i < levels.length && count < maxLength; i++) {
        if (levels[i][0] === 0 && hideZero) {
          continue
        } else {
          hideZero = false
        }
        count++
        texts.push(String(levels[i][0]) + levels[i][1])
      }

      setTimeString(texts.join(' '))
    }
    calculate()
    const intervalId = setInterval(calculate, 1000)
    return () => {
      clearInterval(intervalId)
    }
  }, [endTime, maxLength])

  return (
    <div
      className={cn(
        'flex w-fit flex-row flex-nowrap items-center gap-2 rounded-lg bg-primary-20 px-2 py-1 text-primary',
        className,
      )}
    >
      <Clock size="12px" /> <span className="text-xs">{timeString}</span>
    </div>
  )
}
