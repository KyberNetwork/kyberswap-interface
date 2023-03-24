import { Trans } from '@lingui/macro'
import { useLocation, useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import { useGetAlertStatsQuery } from 'services/priceAlert'
import styled, { useTheme } from 'styled-components'

import { ButtonLight, ButtonOutlined } from 'components/Button'
import Loader from 'components/Loader'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import CreateAlertButton from 'pages/NotificationCenter/PriceAlerts/CreateAlertButton'
import { NOTIFICATION_ROUTES, PRICE_ALERTS_ROUTES } from 'pages/NotificationCenter/const'

const TabButton: React.FC<{ href: PRICE_ALERTS_ROUTES; children: React.ReactNode }> = ({ href, children }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const path = `${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.PRICE_ALERTS}${href}`
  const isActive = location.pathname === path

  const Button = isActive ? ButtonLight : ButtonOutlined

  const onClick = () => {
    navigate(path)
  }

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

    return `${totalNumber}/${maxNumber}`
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
  renderDeleteAllButton: () => React.ReactNode
}
const Header: React.FC<Props> = ({ renderDeleteAllButton }) => {
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
          <TabButton href={PRICE_ALERTS_ROUTES.ACTIVE}>
            <Trans>Active Alerts</Trans>
          </TabButton>
          <TabButton href={PRICE_ALERTS_ROUTES.HISTORY}>
            <Trans>Alerts History</Trans>
          </TabButton>
        </Flex>

        <Flex
          alignItems="center"
          sx={{
            gap: '1rem',
          }}
        >
          {renderDeleteAllButton()}
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
          label={<Trans>Alerts Created: </Trans>}
          isLoading={isLoading}
          totalNumber={data?.totalAlerts}
          maxNumber={data?.maxAlerts}
        />

        <StatItem
          // error if use `t` here
          label={<Trans>Active Alerts: </Trans>}
          isLoading={isLoading}
          totalNumber={data?.totalActiveAlerts}
          maxNumber={data?.maxActiveAlerts}
        />
      </Flex>
    </Wrapper>
  )
}

export default Header
