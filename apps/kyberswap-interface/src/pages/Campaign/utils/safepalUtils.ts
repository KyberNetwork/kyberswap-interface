import { CampaignWeek } from 'pages/Campaign/timelines'

type RangeLike = {
  start: number
  end: number
}

type SafePalWinnerLike = {
  rank?: number | null
  total_points?: number | null
}

export const SAFEPAL_WINNER_RANK_THRESHOLD = 667

export const findCampaignWeekByValue = (weeks: CampaignWeek[], value?: number) => {
  if (value === undefined) return undefined
  return weeks.find(week => week.value === value)
}

export const findActiveCampaignWeek = (weeks: CampaignWeek[], now: number = Math.floor(Date.now() / 1000)) => {
  return weeks.find(week => isCampaignWeekActive(week, now))
}

export const isCampaignWeekActive = (week?: RangeLike, now: number = Math.floor(Date.now() / 1000)) => {
  return !!week && now >= week.start && now < week.end
}

export const isCampaignWeekEnded = (week?: RangeLike, now: number = Math.floor(Date.now() / 1000)) => {
  return !!week && now >= week.end
}

export const getCampaignRangeBounds = (weeks: CampaignWeek[], fallbackTs: number = Math.floor(Date.now() / 1000)) => {
  if (!weeks.length) {
    return { fromTs: fallbackTs, toTs: fallbackTs }
  }

  return {
    fromTs: Math.min(...weeks.map(week => week.start)),
    toTs: Math.max(...weeks.map(week => week.end)),
  }
}

export const getCampaignWeekNumber = (weeks: CampaignWeek[], value?: number) => {
  const index = weeks.findIndex(week => week.value === value)
  return index === -1 ? 0 : index + 1
}

export const isSafePalCampaignWinner = (stats?: SafePalWinnerLike) => {
  if (!stats) return false

  return (stats.rank ?? Infinity) <= SAFEPAL_WINNER_RANK_THRESHOLD && (stats.total_points ?? 0) > 0
}
