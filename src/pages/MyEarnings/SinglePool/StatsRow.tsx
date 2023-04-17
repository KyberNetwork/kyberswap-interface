import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { FeeAmount } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { Link } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'

import { ReactComponent as BarChart } from 'assets/svg/barchart.svg'
import { ButtonLight } from 'components/Button'
import { NetworkLogo } from 'components/Logo'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import useTheme from 'hooks/useTheme'
import { ButtonIcon } from 'pages/Pools/styleds'

const formatValue = (value: string | number) => {
  const num = Number(value)

  if (!Number.isFinite(num)) {
    return '--'
  }
  const formatter = Intl.NumberFormat('en-US', {
    notation: num > 100_000 ? 'compact' : 'standard',
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return formatter.format(num)
}

const formatPercent = (value: string) => {
  const num = Number(value)

  const formatter = Intl.NumberFormat('en-US', {
    notation: num > 10_000_000 ? 'compact' : 'standard',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return formatter.format(num) + '%'
}

const ChainDisplay: React.FC<{ chainId: ChainId }> = ({ chainId }) => {
  return (
    <Flex
      alignItems={'center'}
      sx={{
        gap: '4px',
      }}
    >
      <NetworkLogo
        chainId={chainId}
        style={{
          width: '20px',
          height: '20px',
        }}
      />{' '}
      {NETWORKS_INFO[chainId].name}
    </Flex>
  )
}

type ColumnProps = {
  label: string
  value: React.ReactNode
}
const Column: React.FC<ColumnProps> = ({ label, value }) => {
  const theme = useTheme()
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '8px',
        fontWeight: 500,
        fontSize: '20px',
        lineHeight: '24px',
        color: theme.text,
      }}
    >
      <Text
        as="span"
        sx={{
          fontWeight: 500,
          fontSize: '12px',
          lineHeight: '16px',
          color: theme.subText,
        }}
      >
        {label}
      </Text>

      {value}
    </Flex>
  )
}

type Props = {
  chainId: ChainId
  totalValueLockedUsd: string
  apr: string
  volume24hUsd: number
  fees24hUsd: number

  currency0: Currency | undefined
  currency1: Currency | undefined
  feeAmount: FeeAmount
  renderToggleExpandButton: () => React.ReactNode
}
const StatsRow: React.FC<Props> = ({
  chainId,
  totalValueLockedUsd,
  apr,
  volume24hUsd,
  fees24hUsd,

  currency0,
  currency1,
  feeAmount,

  renderToggleExpandButton,
}) => {
  const nativeToken = NativeCurrencies[chainId]

  // TODO: check native currencies
  const currency0Slug = currency0?.wrapped.address || ''
  const currency1Slug = currency1?.wrapped.address || ''

  return (
    <Box
      sx={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '150px repeat(4, 100px) auto',
        justifyContent: 'space-between',
      }}
    >
      <Column label={t`CHAIN`} value={<ChainDisplay chainId={chainId} />} />

      <Column label={t`TVL`} value={formatValue(totalValueLockedUsd)} />

      <Column label={t`APR`} value={formatPercent(apr)} />

      <Column label={t`VOLUME (24H)`} value={formatValue(volume24hUsd)} />

      <Column label={t`FEES (24H)`} value={formatValue(fees24hUsd)} />

      <Flex
        sx={{
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <ButtonLight
          height="36px"
          as={Link}
          // TODO: use new format of Elastic routes
          to={
            currency0Slug && currency1Slug
              ? `${APP_PATHS.ELASTIC_CREATE_POOL}/${currency0Slug}/${currency1Slug}/${feeAmount}`
              : '#'
          }
        >
          + <Trans>Add Liquidity</Trans>
        </ButtonLight>
        <ButtonIcon
          style={{
            flex: '0 0 36px',
            width: '36px',
            height: '36px',
          }}
        >
          <BarChart />
        </ButtonIcon>

        {renderToggleExpandButton()}
      </Flex>
    </Box>
  )
}

export default StatsRow
