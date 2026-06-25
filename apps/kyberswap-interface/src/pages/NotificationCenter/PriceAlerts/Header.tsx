import { Trans } from '@lingui/macro'
import { useClearAllPriceAlertHistoryMutation } from 'services/announcement'
import { useDeleteAllAlertsMutation, useGetAlertStatsQuery } from 'services/priceAlert'

import { ButtonLight, ButtonOutlined } from 'components/Button'
import Loader from 'components/Loader'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import DeleteAllAlertsButton from 'pages/NotificationCenter/DeleteAllAlertsButton'
import { Tab } from 'pages/NotificationCenter/PriceAlerts'
import CreateAlertButton from 'pages/NotificationCenter/PriceAlerts/CreateAlertButton'

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({
  isActive,
  onClick,
  children,
}) => {
  const props = {
    onClick,
    className: 'h-9 flex-[0_0_fit-content] flex-nowrap whitespace-nowrap py-0 px-2',
  }
  if (isActive) return <ButtonLight {...props}> {children}</ButtonLight>
  return <ButtonOutlined {...props}>{children}</ButtonOutlined>
}

type StatItemProps = {
  isLoading: boolean
  label: React.ReactNode
  totalNumber: number | undefined
  maxNumber: number | undefined
}
const StatItem: React.FC<StatItemProps> = ({ isLoading, label, totalNumber, maxNumber }) => {
  const theme = useTheme()

  const renderContent = () => {
    if (isLoading) {
      return <Loader size="10px" />
    }

    if ((!totalNumber && totalNumber !== 0) || (!maxNumber && maxNumber !== 0)) {
      return '--'
    }

    return `${totalNumber}/${maxNumber}`
  }

  return (
    <span style={{ color: !!totalNumber && totalNumber === maxNumber ? theme.warning : undefined }}>
      {label} {renderContent()}
    </span>
  )
}

type Props = {
  currentTab: Tab
  setCurrentTab: (t: Tab) => void
  disabledClearAll: boolean
}
const Header: React.FC<Props> = ({ currentTab, setCurrentTab, disabledClearAll }) => {
  const { account } = useActiveWeb3React()

  const { data, isLoading } = useGetAlertStatsQuery()
  const [deleteAllActive] = useDeleteAllAlertsMutation()
  const [clearAllHistory] = useClearAllPriceAlertHistoryMutation()

  return (
    <div className="flex flex-col gap-4 border-b border-solid border-border pb-2 max-md:py-4 max-md:pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TabButton isActive={currentTab === Tab.ACTIVE} onClick={() => setCurrentTab(Tab.ACTIVE)}>
            <Trans>Active Alerts</Trans>
          </TabButton>
          <TabButton isActive={currentTab === Tab.HISTORY} onClick={() => setCurrentTab(Tab.HISTORY)}>
            <Trans>Alerts History</Trans>
          </TabButton>
        </div>

        <div className="flex items-center gap-4">
          <DeleteAllAlertsButton
            disabled={disabledClearAll}
            onClear={() =>
              currentTab === Tab.ACTIVE ? deleteAllActive({ account: account ?? '' }) : clearAllHistory()
            }
            notificationName={'Alerts'}
          />
          <CreateAlertButton className="max-md:hidden" />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-medium text-subText">
        <StatItem
          label={<Trans>Alerts Created: </Trans>}
          isLoading={isLoading}
          totalNumber={data?.totalAlerts}
          maxNumber={data?.maxAlerts}
        />

        <StatItem
          label={<Trans>Active Alerts: </Trans>}
          isLoading={isLoading}
          totalNumber={data?.totalActiveAlerts}
          maxNumber={data?.maxActiveAlerts}
        />
      </div>
    </div>
  )
}

export default Header
