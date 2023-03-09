import { t } from '@lingui/macro'
import { Plus } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import { useGetAlertStatsQuery } from 'services/priceAlert'
import { useTheme } from 'styled-components'

import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import DeleteAllAlertsButton from 'pages/NotificationCenter/PriceAlerts/DeleteAllAlertsButton'
import { NOTIFICATION_ROUTES } from 'pages/NotificationCenter/const'

type StatItemProps = {
  isLoading: boolean
  label: string
  totalNumber: number | undefined
  maxNumber: number | undefined
}
const StatItem: React.FC<StatItemProps> = ({ isLoading, label, totalNumber, maxNumber }) => {
  const theme = useTheme()

  const renderContent = () => {
    if (isLoading) {
      return <Loader size="10px" />
    }

    if (!totalNumber || !maxNumber) {
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

const Header = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const { account } = useActiveWeb3React()

  const { data, isLoading } = useGetAlertStatsQuery(account || '')

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
          <ButtonLight
            style={{
              flex: '0 0 fit-content',
              height: '36px',
              padding: '0 8px',
              whiteSpace: 'nowrap',
              flexWrap: 'nowrap',
            }}
          >
            Active Alerts
          </ButtonLight>
          <ButtonOutlined
            style={{
              flex: '0 0 fit-content',
              padding: '0 8px',
              height: '36px',
              whiteSpace: 'nowrap',
              flexWrap: 'nowrap',
            }}
          >
            Alerts History
          </ButtonOutlined>
        </Flex>

        <Flex
          alignItems="center"
          sx={{
            gap: '1rem',
          }}
        >
          <DeleteAllAlertsButton />
          <ButtonPrimary
            style={{
              padding: '0 8px 0 6px',
              gap: '4px',
              flex: '0 0 fit-content',
              height: '36px',
            }}
            onClick={() => {
              navigate(`${APP_PATHS.NOTIFICATION_CENTER}${NOTIFICATION_ROUTES.CREATE_ALERT}`)
            }}
          >
            <Plus size={16} /> Create Alert
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
          label={t`Created Alerts`}
          isLoading={isLoading}
          totalNumber={data?.totalAlerts}
          maxNumber={data?.maxAlert}
        />

        <StatItem
          label={t`Active Alerts`}
          isLoading={isLoading}
          totalNumber={data?.totalActiveAlerts}
          maxNumber={data?.maxActiveAlerts}
        />
      </Flex>
    </Flex>
  )
}

export default Header
