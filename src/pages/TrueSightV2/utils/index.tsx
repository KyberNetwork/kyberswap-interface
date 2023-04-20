import { DefaultTheme } from 'styled-components'

export const calculateValueToColor = (value: number, theme: DefaultTheme) => {
  if (value < 20) {
    return theme.red
  }
  if (value < 40) {
    return '#FFA7C3'
  }
  if (value < 60) {
    return theme.text
  }
  if (value < 80) {
    return '#8DE1C7'
  }
  return theme.primary
}

export const formatShortNum = (num: number, fixed = 1): string => {
  const negative = num < 0
  const absNum = Math.abs(num)
  let formattedNum = ''
  if (absNum > 1000000000) {
    formattedNum = (+(absNum / 1000000000).toFixed(fixed)).toString() + 'B'
  } else if (absNum > 1000000) {
    formattedNum = (+(absNum / 1000000).toFixed(fixed)).toString() + 'M'
  } else if (absNum > 1000) {
    formattedNum = (+(absNum / 1000).toFixed(fixed)).toString() + 'K'
  } else {
    formattedNum = (+absNum.toFixed(fixed)).toString()
  }

  return (negative ? '-' : '') + formattedNum
}

export const formatLocaleStringNum = (num: number): string => {
  if (num === 0) return '--'
  const negative = num < 0
  const absNum = Math.abs(num)
  let formattedNum = ''
  if (absNum > 100000) {
    formattedNum = (+absNum.toFixed(0)).toLocaleString()
  } else if (absNum > 1000) {
    formattedNum = (+absNum.toFixed(2)).toLocaleString()
  } else {
    formattedNum = absNum.toFixed(5)
  }
  return (negative ? '-' : '') + formattedNum
}
