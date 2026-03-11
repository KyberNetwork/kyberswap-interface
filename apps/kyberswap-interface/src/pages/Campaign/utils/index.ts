import { CampaignWeek } from 'pages/Campaign/timelines'

export const getCurrentWeek = () => {
  const currentDate: Date = new Date()
  const startOfYear: Date = new Date(Date.UTC(currentDate.getUTCFullYear(), 0, 1))

  // Calculate the day of the week for the start of the year in UTC
  const dayOfWeek: number = startOfYear.getUTCDay()

  // Adjust the start of the year to the nearest Monday in UTC
  let firstMonday: Date
  if (dayOfWeek <= 4) {
    firstMonday = new Date(startOfYear.setUTCDate(startOfYear.getUTCDate() - dayOfWeek + 1))
  } else {
    firstMonday = new Date(startOfYear.setUTCDate(startOfYear.getUTCDate() + (8 - dayOfWeek)))
  }

  // Calculate the difference in days from the first Monday of the year in UTC
  const diffInMs: number = currentDate.getTime() - firstMonday.getTime()
  const diffInDays: number = Math.floor(diffInMs / (24 * 60 * 60 * 1000))

  // Calculate the week number
  const weekNumber: number = Math.ceil((diffInDays + 1) / 7)

  const currentYear = new Date().getFullYear()

  return { currentWeek: weekNumber, currentYear }
}

export const resolveSelectedCampaignWeek = (
  weeks: CampaignWeek[],
  selectedWeek: number,
  now: number = Math.floor(Date.now() / 1000),
) => {
  if (!weeks.length) return undefined

  const selected = weeks.find(week => week.value === selectedWeek)
  if (selected) return selected

  const active = weeks.find(week => now >= week.start && now < week.end)
  if (active) return active

  const first = weeks[0]
  const last = weeks[weeks.length - 1]

  if (now < first.start) return first
  if (now >= last.end) return last
  return first
}
