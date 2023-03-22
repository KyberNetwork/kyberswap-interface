import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import { useGetAlertStatsQuery } from 'services/priceAlert'
import styled, { useTheme } from 'styled-components'

import { ButtonLight, ButtonOutlined } from 'components/Button'
import Loader from 'components/Loader'
import { useActiveWeb3React } from 'hooks'
import { Tab } from 'pages/NotificationCenter/PriceAlerts'
import CreateAlertButton from 'pages/NotificationCenter/PriceAlerts/CreateAlertButton'
import DeleteAllAlertsButton from 'pages/NotificationCenter/PriceAlerts/DeleteAllAlertsButton'

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

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem 0;
    ${CreateAlertButton} {
      display: none;
    }
  `}
`

type Props = {
  currentTab: Tab
  setCurrentTab: (t: Tab) => void
}
const Header: React.FC<Props> = ({ currentTab, setCurrentTab }) => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { data, isLoading } = useGetAlertStatsQuery(account || '', { skip: !account })
  return (
    <Wrapper>
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
          <CreateAlertButton />
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
    </Wrapper>
  )
}

export default Header
