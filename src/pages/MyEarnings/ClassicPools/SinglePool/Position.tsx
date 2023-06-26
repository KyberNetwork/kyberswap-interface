import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { Copy, Minus, Plus } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as BarChart } from 'assets/svg/barchart.svg'
import { ButtonLight } from 'components/Button'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { ActionButton } from 'pages/MyEarnings/ActionButton'
import { ButtonIcon } from 'pages/Pools/styleds'
import { UserLiquidityPosition } from 'state/pools/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { currencyId } from 'utils/currencyId'
import { getMyLiquidity } from 'utils/dmm'

const CustomActionButton = styled(ActionButton)`
  flex: 1;
`

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
  currency0: Currency | undefined
  currency1: Currency | undefined
  poolAddress: string
  chainId: ChainId
  userLiquidity: UserLiquidityPosition | undefined
}
const Position: React.FC<Props> = ({ chainId, userLiquidity, currency0, currency1, poolAddress }) => {
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const networkInfo = NETWORKS_INFO[chainId]

  const myLiquidityBalance = userLiquidity ? getMyLiquidity(userLiquidity) : '--'

  // TODO: check native currencies
  const currency0Slug = ''
  const currency1Slug = ''

  if (upToExtraSmall) {
    return (
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <Flex justifyContent={'space-between'}>
          <ColumnForMobile label={t``} value={formatValue('1234567')} />
          <ColumnForMobile align="right" label={t`APR`} value={formatPercent('12.34')} />
        </Flex>

        <MobileSeparator />

        <Flex justifyContent={'space-between'}>
          <ColumnForMobile label={t`VOLUME (24H)`} value={formatValue('1234567')} />
          <ColumnForMobile align="right" label={t`FEES (24H)`} value={formatValue('1234567')} />
        </Flex>

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
                ? `${APP_PATHS.ELASTIC_CREATE_POOL}/${currency0Slug}/${currency1Slug}/${123}`
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
            <Copy width="18px" height="18px" />
          </ButtonIcon>

          <ButtonIcon
            style={{
              flex: '0 0 36px',
              width: '36px',
              height: '36px',
            }}
          >
            <BarChart />
          </ButtonIcon>
        </Flex>
      </Flex>
    )
  }

  return (
    <Box
      sx={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr) 320px',
        justifyContent: 'space-between',
        background: theme.buttonBlack,
        borderRadius: '20px',
        padding: '24px',
        gap: '8px',
      }}
    >
      <Column label={t`My Liquidity Balance`} value={myLiquidityBalance} />

      <Column label={t`Total LP Tokens`} value={formatValue('12345')} />

      <Column label={t`Share of Pool`} value={formatPercent('1.23')} />

      <Column label={t`My Staked Balance`} value={formatValue('123456')} />

      <Column label={t`Staked LP Tokens`} value={formatValue('1234')} />

      <Flex
        sx={{
          alignItems: 'center',
          gap: '12px',
          flex: '0 0 fit-content',
        }}
      >
        <CustomActionButton
          $variant="red"
          as={Link}
          to={`/${networkInfo.route}${APP_PATHS.CLASSIC_REMOVE_POOL}/${currencyId(currency0, chainId)}/${currencyId(
            currency1,
            chainId,
          )}/${poolAddress}`}
        >
          <Minus size="16px" /> <Trans>Remove Liquidity</Trans>
        </CustomActionButton>

        <CustomActionButton
          $variant="green"
          as={Link}
          to={`/${networkInfo.route}${APP_PATHS.CLASSIC_ADD_LIQ}/${currencyId(currency0, chainId)}/${currencyId(
            currency1,
            chainId,
          )}/${poolAddress}`}
        >
          <Plus size="16px" /> <Trans>Add Liquidity</Trans>
        </CustomActionButton>
      </Flex>
    </Box>
  )
}

export default Position
