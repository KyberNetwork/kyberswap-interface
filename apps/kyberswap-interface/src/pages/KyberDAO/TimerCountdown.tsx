import { CSSProperties, useEffect, useState } from 'react'
import { Clock } from 'react-feather'

export default function TimerCountdown({
  endTime,
  maxLength = Number.MAX_SAFE_INTEGER,
  style,
}: {
  endTime: number
  maxLength?: number
  style?: CSSProperties
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
      style={style}
      className="mx-1 flex w-fit flex-row flex-nowrap items-center gap-1 rounded-lg bg-primary-20 px-2 py-[3px] text-primary"
    >
      <Clock size="12px" /> <span className="text-xs leading-3">{timeString}</span>
    </div>
  )
}
