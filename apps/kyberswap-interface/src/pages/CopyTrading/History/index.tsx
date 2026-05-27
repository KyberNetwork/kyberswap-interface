import { useNavigate } from 'react-router-dom'
import { CopyTradingStat, copyTradingMockData, useGetCopyTradingMyCopiesOverviewQuery } from 'services/copyTrading'

import { Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'

import { StatCard } from '../components/Stats'
import ClosedSubscriptionsTable from './ClosedSubscriptionsTable'

const HistoryView = () => {
  const navigate = useNavigate()
  const { data: myCopiesOverview = copyTradingMockData.myCopiesOverview } = useGetCopyTradingMyCopiesOverviewQuery()

  const historyStats: CopyTradingStat[] = [
    { icon: 'aum', value: '+$12,450.50', label: 'Realised P&L (All time)', color: 'bg-blue/20 text-blue' },
    { icon: 'copiers', value: '1,342', label: 'Closed Positions', color: 'bg-primary-20 text-primary' },
    { icon: 'volume', value: '$85,000.00', label: 'Closed Capital (Returned)', color: 'bg-primary-12 text-primary' },
  ]

  return (
    <main className="min-w-0 flex-1 px-10 py-14 max-md:px-4">
      <Stack className="w-full gap-7">
        <h1 className="m-0 text-4xl font-semibold leading-tight text-text">History</h1>
        <div className="grid grid-cols-3 gap-6 max-xl:grid-cols-2 max-md:grid-cols-1">
          {historyStats.map(item => (
            <StatCard key={item.label} item={item} />
          ))}
        </div>
        <ClosedSubscriptionsTable
          rows={[...myCopiesOverview.closedSubscriptions, ...myCopiesOverview.closedSubscriptions]}
          onOpenSubscription={subscription => navigate(`${APP_PATHS.COPY_TRADING}/history/${subscription.id}`)}
        />
      </Stack>
    </main>
  )
}

export default HistoryView
