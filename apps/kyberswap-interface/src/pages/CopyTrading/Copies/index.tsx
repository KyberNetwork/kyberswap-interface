import { useNavigate } from 'react-router-dom'
import { copyTradingMockData, useGetCopyTradingMyCopiesOverviewQuery } from 'services/copyTrading'

import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { cn } from 'utils/cn'

import { StatCard } from '../components/Stats'
import ActiveSubscriptionsTable from './ActiveSubscriptionsTable'

const CopiesView = () => {
  const navigate = useNavigate()
  const { data: myCopiesOverview = copyTradingMockData.myCopiesOverview } = useGetCopyTradingMyCopiesOverviewQuery()

  return (
    <main className="min-w-0 flex-1 px-10 py-14 max-md:px-4">
      <Stack className="w-full gap-7">
        <Stack className="gap-3.5">
          <h1 className="m-0 text-4xl font-semibold leading-tight text-text">
            Open <span className="font-normal text-primary">Copies</span>
          </h1>
          <p className="m-0 text-lg text-subText">Monitor and manage all your active copy positions.</p>
        </Stack>
        <div className="grid grid-cols-4 gap-6 max-xl:grid-cols-2 max-md:grid-cols-1">
          {myCopiesOverview.stats.map(item => (
            <StatCard key={item.label} item={item} />
          ))}
        </div>
        <ActiveSubscriptionsTable
          rows={myCopiesOverview.activeSubscriptions}
          onOpenSubscription={subscription => navigate(`${APP_PATHS.COPY_TRADING}/copies/${subscription.id}`)}
        />
        <Stack className="gap-5 rounded-xl bg-buttonBlack p-7">
          <HStack className="items-center gap-2">
            <span className="text-sm font-semibold uppercase text-subText">Alerts Feed</span>
            <span className="rounded bg-primary-12 px-2 py-0.5 text-xs font-semibold text-primary">LIVE</span>
          </HStack>
          {myCopiesOverview.alerts.map(alert => (
            <HStack key={alert.message} className="gap-3.5">
              <span className={cn('mt-1 size-2 rounded-full', alert.color)} />
              <Stack className="gap-1">
                <span className="text-sm text-text">{alert.message}</span>
                <span className="text-sm text-subText">{alert.time}</span>
              </Stack>
            </HStack>
          ))}
        </Stack>
      </Stack>
    </main>
  )
}

export default CopiesView
