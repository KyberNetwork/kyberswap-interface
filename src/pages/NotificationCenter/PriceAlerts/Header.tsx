import { Trans } from '@lingui/macro'
import { Info, Plus } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import { useGetAlertStatsQuery } from 'services/priceAlert'
import { useTheme } from 'styled-components'

import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { Tab } from 'pages/NotificationCenter/PriceAlerts'
import DeleteAllAlertsButton from 'pages/NotificationCenter/PriceAlerts/DeleteAllAlertsButton'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({
  isActive,
  onClick,
  children,
}) => {
  const Button = isActive ? ButtonLight : ButtonOutlined

  return (
    <Button
      style={{
        flex: '0 0 fit-content',
        height: '36px',
        padding: '0 8px',
        whiteSpace: 'nowrap',
        flexWrap: 'nowrap',
      }}
      onClick={onClick}
    >
      {children}
    </Button>
  )
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

    return `${totalNumber} / ${maxNumber}`
  }

  return (
    <Text as="span" color={!!totalNumber && totalNumber === maxNumber ? theme.warning : undefined}>
      {label} {renderContent()}
    </Text>
  )
}

type Props = {
  currentTab: Tab
  setCurrentTab: (t: Tab) => void
}
const Header: React.FC<Props> = ({ currentTab, setCurrentTab }) => {
  const navigate = useNavigate()
  const theme = useTheme()
  const { account } = useActiveWeb3React()

  const { data, isLoading } = useGetAlertStatsQuery(account || '', { skip: !account })

  const isMaxQuota = data ? data.totalAlerts >= data.maxAlerts : false
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '1rem',
        paddingBottom: '0.5rem',
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      <Flex alignItems={'center'} justifyContent="space-between">
        <Flex
          alignItems="center"
          sx={{
            gap: '0.5rem',
          }}
        >
          <TabButton isActive={currentTab === Tab.ACTIVE} onClick={() => setCurrentTab(Tab.ACTIVE)}>
            <Trans>Active Alerts</Trans>
          </TabButton>
          <TabButton isActive={currentTab === Tab.HISTORY} onClick={() => setCurrentTab(Tab.HISTORY)}>
            <Trans>Alerts History</Trans>
          </TabButton>
        </Flex>

        <Flex
          alignItems="center"
          sx={{
            gap: '1rem',
          }}
        >
          <DeleteAllAlertsButton currentTab={currentTab} />

          <ButtonPrimary
            style={{
              padding: '0 8px 0 6px',
              gap: '4px',
              flex: '0 0 fit-content',
              height: '36px',
            }}
            disabled={isMaxQuota}
            onClick={() => {
              navigate(`${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.CREATE_ALERT}`)
            }}
          >
            <MouseoverTooltip
              text={
                isMaxQuota
                  ? `You had created maximum number of alert. Please remove some if you want to create a new alert`
                  : ''
              }
            >
              {isMaxQuota ? <Info size={16} /> : <Plus size={16} />}
            </MouseoverTooltip>
            <Trans>Create Alert</Trans>
          </ButtonPrimary>
        </Flex>
      </Flex>

      <Flex
        alignItems="center"
        justifyContent="space-between"
        sx={{
          color: theme.subText,
          fontSize: '12px',
          fontWeight: 500,
        }}
      >
        <StatItem
          // error if use `t` here
          label={<Trans>Created Alerts</Trans>}
          isLoading={isLoading}
          totalNumber={data?.totalAlerts}
          maxNumber={data?.maxAlerts}
        />

        <StatItem
          // error if use `t` here
          label={<Trans>Active Alerts</Trans>}
          isLoading={isLoading}
          totalNumber={data?.totalActiveAlerts}
          maxNumber={data?.maxActiveAlerts}
        />
      </Flex>
    </Flex>
  )
}

export default Header
