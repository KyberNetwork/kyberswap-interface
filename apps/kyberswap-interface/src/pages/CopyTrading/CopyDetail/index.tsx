import { ArrowLeft } from 'react-feather'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useGetCopyTradingSubscriptionDetailQuery } from 'services/copyTrading'

import { Center, HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'

import { AgentIdentity } from '../components/AgentIdentity'
import LineChartMock from '../components/LineChartMock'
import ProfileSidePanel from '../components/ProfileSidePanel'
import { ProfileStatCard } from '../components/Stats'
import { CopyPositionsTable, TradeHistoryTable } from './Tables'

const CopyDetailView = ({ backPath }: { backPath: 'copies' | 'history' }) => {
  const navigate = useNavigate()
  const { copyId } = useParams()
  const {
    data: subscriptionDetail,
    isFetching,
    isLoading,
    isUninitialized,
  } = useGetCopyTradingSubscriptionDetailQuery(copyId || '', { skip: !copyId })

  if (!subscriptionDetail && (isFetching || isLoading || isUninitialized)) return null
  if (!subscriptionDetail) return <Navigate to={`${APP_PATHS.COPY_TRADING}/${backPath}`} replace />

  const isClosed = subscriptionDetail.subscription.status === 'closed'

  return (
    <main className="min-w-0 flex-1 px-10 py-9 max-md:px-4">
      <Stack className="w-full gap-7">
        <button
          type="button"
          onClick={() => navigate(`${APP_PATHS.COPY_TRADING}/${backPath}`)}
          className="flex h-8 w-fit cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-sm text-subText hover:text-text"
        >
          <ArrowLeft size={14} />
          Back to {backPath === 'history' ? 'History' : 'My Copies'}
        </button>
        <AgentIdentity agent={subscriptionDetail.subscription.agent} />

        {isClosed ? (
          <div className="grid grid-cols-3 gap-6 max-xl:grid-cols-1">
            <Stack className="col-span-2 min-w-0 gap-5 max-xl:col-span-1">
              <HStack className="items-center justify-between gap-5 rounded-xl bg-buttonBlack p-5 max-2xl:flex-col max-2xl:items-start">
                <HStack className="items-center gap-5">
                  <Center className="h-14 rounded-xl bg-primary-12 px-6 text-lg font-semibold text-primary">
                    Started Copy
                  </Center>
                  <Stack>
                    <span className="text-sm text-subText">24/07/2025 09:14</span>
                    <span className="text-lg font-semibold text-text">In: $5,000.00</span>
                  </Stack>
                </HStack>
                <div className="h-0.5 w-56 bg-gradient-to-r from-primary to-red max-2xl:hidden" />
                <HStack className="items-center gap-5">
                  <Stack className="items-end max-2xl:items-start">
                    <span className="text-sm text-subText">30/07/2025 09:00</span>
                    <span className="text-lg font-semibold text-text">Out: $6,200.00</span>
                  </Stack>
                  <Center className="h-14 rounded-xl bg-red-20 px-6 text-lg font-semibold text-red">
                    Stopped Copy
                  </Center>
                </HStack>
              </HStack>
              <LineChartMock />
            </Stack>
            <Stack className="min-w-0 gap-5">
              <Center className="h-24 rounded-xl bg-buttonBlack px-6 text-right text-2xl font-semibold text-primary">
                Total Realised P&L&nbsp;&nbsp; +$86,850
              </Center>
              <ProfileSidePanel
                copiedCapital={subscriptionDetail.profile.copiedCapital}
                isCopied={false}
                wishlistTokens={subscriptionDetail.profile.wishlistTokens}
              />
            </Stack>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 max-xl:grid-cols-1">
            <Stack className="col-span-2 min-w-0 gap-5 max-xl:col-span-1">
              <div className="grid grid-cols-5 gap-4 max-2xl:grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1">
                {subscriptionDetail.stats.map(item => (
                  <ProfileStatCard key={item.label} item={item} />
                ))}
              </div>
              <Stack className="overflow-hidden rounded-xl bg-buttonBlack">
                <HStack className="flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-5">
                  <HStack className="items-center gap-2">
                    <h2 className="m-0 text-base font-semibold text-text">My Positions</h2>
                    <Center className="size-5 rounded-full bg-primary-12 text-xs text-primary">13</Center>
                  </HStack>
                  <HStack className="flex-wrap gap-5 text-sm">
                    <span className="text-subText">Realised P&L</span>
                    <span className="font-semibold text-primary">+$286.6</span>
                    <span className="text-subText">APR Since Copy</span>
                    <span className="font-semibold text-primary">+124.6%</span>
                  </HStack>
                </HStack>
                <div className="overflow-hidden">
                  <CopyPositionsTable rows={subscriptionDetail.positions} />
                </div>
              </Stack>
              <LineChartMock />
            </Stack>
            <ProfileSidePanel
              copiedCapital={subscriptionDetail.profile.copiedCapital}
              isCopied
              wishlistTokens={subscriptionDetail.profile.wishlistTokens}
            />
          </div>
        )}

        {isClosed && (
          <Stack className="overflow-hidden rounded-xl bg-buttonBlack">
            <HStack className="items-center gap-2 border-b border-border px-8 py-5">
              <h2 className="m-0 text-lg font-semibold text-text">Full Closed Positions</h2>
              <Center className="h-6 rounded-full bg-subText-20 px-3 text-xs text-text">145</Center>
            </HStack>
            <div className="overflow-hidden">
              <TradeHistoryTable rows={subscriptionDetail.closedPositions} />
            </div>
          </Stack>
        )}
      </Stack>
    </main>
  )
}

export default CopyDetailView
