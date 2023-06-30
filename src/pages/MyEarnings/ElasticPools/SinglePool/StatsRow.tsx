import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { FeeAmount } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as BarChart } from 'assets/svg/barchart.svg'
import { ButtonLight } from 'components/Button'
import CopyIcon from 'components/Icons/CopyIcon'
import { NetworkLogo } from 'components/Logo'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { VERSION } from 'constants/v2'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useTheme from 'hooks/useTheme'
import { ButtonIcon } from 'pages/Pools/styleds'
import { useAppSelector } from 'state/hooks'
import { MEDIA_WIDTHS } from 'theme'

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

const MobileSeparator = styled.div`
  width: 100%;
  height: 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`

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

const ColumnForMobile: React.FC<ColumnProps & { align?: 'left' | 'right' }> = ({ label, value, align = 'left' }) => {
  const theme = useTheme()
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '4px',
        fontWeight: 500,
        fontSize: '16px',
        lineHeight: '20px',
        color: theme.text,
        alignItems: align === 'left' ? 'flex-start' : 'flex-end',
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
  poolAddress: string

  analyticUrl: string

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
  poolAddress,

  analyticUrl,

  renderToggleExpandButton,
}) => {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const upTo1225px = useMedia(`(max-width: 1225px)`)
  const chainRoute = NETWORKS_INFO[chainId].route
  const [, copy] = useCopyClipboard()
  const theme = useTheme()
  const isLegacyPool = useAppSelector(state => state.myEarnings.activeTab === VERSION.ELASTIC_LEGACY)

  const currency0Slug = currency0?.isNative ? currency0.symbol : currency0?.wrapped.address || ''
  const currency1Slug = currency1?.isNative ? currency1.symbol : currency1?.wrapped.address || ''

  const renderAddLiquidityButton = () => {
    if (isLegacyPool) {
      return (
        <ButtonLight
          style={{
            flex: '0 0 fit-content',
          }}
          height="36px"
          disabled
        >
          + <Trans>Add Liquidity</Trans>
        </ButtonLight>
      )
    }

    return (
      <ButtonLight
        style={{
          flex: '0 0 fit-content',
        }}
        height="36px"
        as={Link}
        to={
          currency0Slug && currency1Slug
            ? `/${chainRoute}${APP_PATHS.ELASTIC_CREATE_POOL}/${currency0Slug}/${currency1Slug}/${feeAmount}`
            : '#'
        }
      >
        + <Trans>Add Liquidity</Trans>
      </ButtonLight>
    )
  }

  const renderCopyButton = () => {
    return (
      <ButtonIcon
        style={{
          flex: '0 0 36px',
          width: '36px',
          height: '36px',
        }}
        onClick={() => copy(poolAddress)}
      >
        <CopyIcon size={20} />
      </ButtonIcon>
    )
  }

  const renderAnalyticsButton = () => {
    return (
      <ButtonIcon
        style={{
          flex: '0 0 36px',
          width: '36px',
          height: '36px',
        }}
        as="a"
        href={analyticUrl}
        target="_blank"
      >
        <BarChart color={theme.subText} />
      </ButtonIcon>
    )
  }

  if (upToExtraSmall) {
    return (
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <Flex justifyContent={'space-between'}>
          <ColumnForMobile label={t`CHAIN`} value={<ChainDisplay chainId={chainId} />} />
        </Flex>

        <MobileSeparator />

        <Flex justifyContent={'space-between'}>
          <ColumnForMobile label={t`TVL`} value={formatValue(totalValueLockedUsd)} />
          <ColumnForMobile align="right" label={t`APR`} value={formatPercent(apr)} />
        </Flex>

        <MobileSeparator />

        <Flex justifyContent={'space-between'}>
          <ColumnForMobile label={t`VOLUME (24H)`} value={formatValue(volume24hUsd)} />
          <ColumnForMobile align="right" label={t`FEES (24H)`} value={formatValue(fees24hUsd)} />
        </Flex>

        <Flex
          sx={{
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {renderAddLiquidityButton()}
          {renderCopyButton()}
          {renderAnalyticsButton()}
          {renderToggleExpandButton()}
        </Flex>
      </Flex>
    )
  }

  if (upTo1225px) {
    return (
      <Flex
        flexDirection={'column'}
        sx={{
          gap: '8px',
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '150px repeat(4, 100px)',
            justifyContent: 'space-between',
          }}
        >
          <Column label={t`CHAIN`} value={<ChainDisplay chainId={chainId} />} />

          <Column label={t`TVL`} value={formatValue(totalValueLockedUsd)} />

          <Column label={t`APR`} value={formatPercent(apr)} />

          <Column label={t`VOLUME (24H)`} value={formatValue(volume24hUsd)} />

          <Column label={t`FEES (24H)`} value={formatValue(fees24hUsd)} />
        </Box>

        <Flex
          sx={{
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'space-between',
          }}
        >
          {renderAddLiquidityButton()}
          <Flex
            sx={{
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {renderAnalyticsButton()}
            {renderToggleExpandButton()}
          </Flex>
        </Flex>
      </Flex>
    )
  }

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
        {renderAddLiquidityButton()}
        {renderAnalyticsButton()}
        {renderToggleExpandButton()}
      </Flex>
    </Box>
  )
}

export default StatsRow
