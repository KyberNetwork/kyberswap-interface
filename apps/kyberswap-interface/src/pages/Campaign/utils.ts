export const getCurrentWeek = (): number => {
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

  return weekNumber
}
