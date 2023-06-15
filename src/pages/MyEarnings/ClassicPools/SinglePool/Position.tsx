import { Trans, t } from '@lingui/macro'
import { Copy } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as BarChart } from 'assets/svg/barchart.svg'
import { ButtonLight } from 'components/Button'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { ButtonIcon } from 'pages/Pools/styleds'
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

const Position: React.FC = () => {
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

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
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '150px repeat(4, 100px) auto',
        justifyContent: 'space-between',
        background: theme.buttonBlack,
        borderRadius: '20px',
      }}
    >
      <Column label={t`My Liquidity Balance`} value={formatValue('231231')} />

      <Column label={t`Total LP Tokens`} value={formatValue('12345')} />

      <Column label={t`Share of Pool`} value={formatPercent('1.23')} />

      <Column label={t`My Staked Balance`} value={formatValue('123456')} />

      <Column label={t`Staked LP Tokens`} value={formatValue('1234')} />

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
              ? `${APP_PATHS.ELASTIC_CREATE_POOL}/${currency0Slug}/${currency1Slug}/${12345}`
              : '#'
          }
        >
          - <Trans>Remove Liquidity</Trans>
        </ButtonLight>

        <ButtonLight
          height="36px"
          as={Link}
          // TODO: use new format of Elastic routes
          to={
            currency0Slug && currency1Slug
              ? `${APP_PATHS.ELASTIC_CREATE_POOL}/${currency0Slug}/${currency1Slug}/${12345}`
              : '#'
          }
        >
          + <Trans>Add Liquidity</Trans>
        </ButtonLight>
      </Flex>
    </Box>
  )
}

export default Position
