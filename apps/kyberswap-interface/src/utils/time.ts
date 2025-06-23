import { t } from '@lingui/macro'
import dayjs from 'dayjs'

// ex: 60 => 1 minute
export const formatTimeDuration = (t: number) => {
  if (t > 3124224000) return 'Forever'
  const str = dayjs.duration(t, 'seconds').humanize()
  return str.includes('few') ? str : str.replace('a ', '1 ').replace('an ', '1 ')
}

const formatMulti = (n: number, str: string) => (n === 1 ? str : str + 's')
export const formatTime = (time: number) => {
  const delta = (Date.now() - time * 1000) / 1000
  const min = Math.floor(delta / 60)
  if (min < 1) return t`< 1 minute ago`
  if (min < 60) {
    const formatM = formatMulti(min, 'minute')
    return t`${min} ${formatM} ago`
  }
  const hour = Math.floor(delta / 3600)
  if (hour < 24) {
    const temp = formatMulti(hour, 'hour')
    return t`${hour} ${temp} ago`
  }
  const day = Math.floor(delta / (24 * 3600))
  const temp = formatMulti(day, 'day')
  return t`${day} ${temp} ago`
}

// 1800 => 00:03:00
const pad = (n: number) => (n < 10 ? `0${n}` : n)
export const formatRemainTime = (timeInSeconds: number) => {
  const hours = Math.floor(timeInSeconds / 3600)
  const minutes = Math.floor((timeInSeconds % 3600) / 60)
  const seconds = timeInSeconds % 60
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}
