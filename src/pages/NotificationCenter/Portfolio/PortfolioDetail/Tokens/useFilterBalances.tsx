import { t } from '@lingui/macro'
import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useGetPortfoliosSettingsQuery } from 'services/portfolio'

import { APP_PATHS } from 'constants/index'
import { PortfolioChainBalance, PortfolioWalletBalance } from 'pages/NotificationCenter/Portfolio/type'

const useFilterBalances = () => {
  const { pathname } = useLocation()
  const { data: settings } = useGetPortfoliosSettingsQuery(undefined, {
    skip: !pathname.startsWith(APP_PATHS.MY_PORTFOLIO),
  })

  const filterBalance = useCallback(
    <T extends PortfolioWalletBalance | PortfolioChainBalance>(balances: T[]) => {
      if (!settings?.isHideDust) return { chartData: balances, tableData: balances }
      const tableData = balances.filter(el => parseFloat(el.valueUsd) >= settings.dustThreshold)
      const smallItems = balances.filter(el => parseFloat(el.valueUsd) < settings.dustThreshold)
      const chartData = [...tableData] as any[] // todo
      if (smallItems.length)
        chartData.push({
          symbol: t`Others`,
          value: smallItems.reduce((total, item) => total + +item.valueUsd, 0) + '',
          percent: smallItems.reduce((total, item) => total + +item.percentage, 0),
        })
      return { chartData, tableData }
    },
    [settings],
  )

  return filterBalance
}
export default useFilterBalances
