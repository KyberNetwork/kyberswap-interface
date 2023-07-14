import { transparentize } from 'polished'
import { useEffect, useState } from 'react'
import { Clock } from 'react-feather'
import { Text } from 'rebass'
import { useTheme } from 'styled-components'

import { RowFit } from 'components/Row'

export default function TimerCountdown({ endTime }: { endTime: number }) {
  const theme = useTheme()
  const [timeString, setTimeString] = useState<string>('')
  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = endTime - Math.floor(Date.now() / 1000)
      if (seconds < 0) return setTimeString('')
      if (seconds < 60) return setTimeString(Math.floor(seconds) + 's')
      const levels = [
        [Math.floor(seconds / 31536000), 'years'],
        [Math.floor((seconds % 31536000) / 86400), ' days'],
        [Math.floor(((seconds % 31536000) % 86400) / 3600), 'h'],
        [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 'm'],
        [seconds - Math.floor(seconds / 60) * 60, 's'],
      ]

      let returntext = ''
      let hideZero = true
      for (let i = 0, max = levels.length; i < max; i++) {
        if (levels[i][0] === 0 && hideZero) {
          continue
        } else {
          hideZero = false
        }
        returntext += ' ' + levels[i][0] + levels[i][1]
      }

      setTimeString(returntext.trim())
    }, 1000)
    return () => {
      clearInterval(interval)
    }
  }, [endTime])

  return (
    <>
      <RowFit
        backgroundColor={transparentize(0.8, theme.primary)}
        color={theme.primary}
        padding="3px 8px"
        margin="0px 4px"
        style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        <Clock size="12px" />{' '}
        <Text fontSize="12px" lineHeight="12px">
          {timeString || '--'}
        </Text>
      </RowFit>
    </>
  )
}
