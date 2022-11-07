const ONE_MONTH = 30 * 24 * 60 * 60 * 1000

type Survey = {
  id: string
  title: string
}

const getSavedTimeInLocal = (key: string): number => {
  const rawValue = localStorage.getItem(key)
  if (!rawValue) {
    return 0
  }

  const parsedValue = Number(rawValue)
  if (Number.isNaN(parsedValue)) {
    return 0
  }

  return parsedValue
}

const saveTimeLocal = (key: string, time: number) => {
  localStorage.setItem(key, String(time))
}

const swapCompleteSurvey = {
  id: 'Swap_Complete',
  title: 'How would you rate your experience swapping on Kyberswap?',
}

const addLiquiditySurvey = {
  id: 'Add_Liquidity',
  title: 'How would you rate your experience adding liquidity to KyberSwap?',
}

const showSurvey = (survey: Survey) => {
  const sleek = window.$sleek
  if (!sleek) {
    return
  }

  const lastTimeSaved = getSavedTimeInLocal(survey.id)
  // if (Date.now() - lastTimeSaved < ONE_MONTH) {
  //   return
  // }

  sleek.setUser({
    anonymous: true,
  })
  sleek.showPopup('satisfaction', survey.title, {
    data: survey.id,
  })

  saveTimeLocal(survey.id, Date.now())
}

export const showSwapCompleteSurvey = () => {
  showSurvey(swapCompleteSurvey)
}

export const showAddLiquiditySurvey = () => {
  showSurvey(addLiquiditySurvey)
}
