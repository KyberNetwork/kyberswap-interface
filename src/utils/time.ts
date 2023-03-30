import dayjs from 'dayjs'

// ex: 60 => 1 minute
export const formatTimeDuration = (t: number) => {
  return dayjs.duration(t, 'seconds').humanize().replace('a ', '1 ').replace('an ', '1 ')
}

export const formatTime = (time: number) => {
  const delta = (Date.now() - time * 1000) / 1000
  const min = Math.floor(delta / 60)
  if (min < 1) return `< 1 minute ago`
  if (min < 60) return `${min} minutes ago`
  const hour = Math.floor(delta / 3600)
  if (hour < 24) return `${hour} hours ago`
  const day = Math.floor(delta / (24 * 3600))
  return `${day} days ago`
}
