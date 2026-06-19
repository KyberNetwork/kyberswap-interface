import { CampaignWeek } from 'pages/Campaign/timelines'

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
