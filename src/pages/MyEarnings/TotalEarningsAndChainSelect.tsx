import { rgba } from 'polished'
import { Share2 } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as RefreshIcon } from 'assets/svg/refresh.svg'
import useTheme from 'hooks/useTheme'
import MultipleChainSelect from 'pages/MyEarnings/MultipleChainSelect'

// TODO: move to common
const formatPercent = (value: number) => {
  const formatter = Intl.NumberFormat('en-US', {
    notation: 'standard',
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return formatter.format(value)
}

const formatValue = (value: number) => {
  const formatter = Intl.NumberFormat('en-US', {
    notation: 'standard',
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return formatter.format(value)
}

const Value = styled.span`
  font-weight: 500;
  font-size: 36px;
  line-height: 44px;
  white-space: nowrap;
  flex: 0 0 max-content;
`

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex-direction: column;
    gap: 24px;
    align-items: initial;
    justify-content: initial;

    ${MultipleChainSelect} {
      flex: 1;
    }
  `}
`

type Props = {
  totalEarningToday: number
  totalEarningYesterday: number
}
const TotalEarningsAndChainSelect: React.FC<Props> = ({ totalEarningToday, totalEarningYesterday }) => {
  const theme = useTheme()

  if (Number.isNaN(totalEarningToday)) {
    return <Value>--</Value>
  }

  const diffPercent =
    totalEarningYesterday && !Number.isNaN(totalEarningYesterday)
      ? formatPercent(totalEarningToday / totalEarningYesterday - 1)
      : ''

  return (
    <Flex
      sx={{
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <Value>{formatValue(totalEarningToday)}</Value>

      {diffPercent ? (
        <Flex
          sx={{
            flex: '0 0 max-content',
            alignItems: 'center',
            justifyContent: 'center',
            height: '36px',
            padding: '0 12px',
            fontWeight: 500,
            fontSize: '14px',
            lineHeight: '20px',
            color: diffPercent.startsWith('-') ? theme.red : theme.primary,
            background: rgba(diffPercent.startsWith('-') ? theme.red : theme.primary, 0.3),
            borderRadius: '999px',
          }}
        >
          {diffPercent}
        </Flex>
      ) : null}

      <Flex
        sx={{
          flex: '0 0 36px',
          alignItems: 'center',
          justifyContent: 'center',
          height: '36px',
          borderRadius: '999px',
          color: theme.subText,
          background: theme.background,
        }}
      >
        <Share2 size="16px" />
      </Flex>

      <Flex
        sx={{
          flex: '0 0 36px',
          alignItems: 'center',
          justifyContent: 'center',
          height: '36px',
          borderRadius: '999px',
          color: theme.subText,
          background: theme.background,
        }}
      >
        <RefreshIcon width="17px" height="17px" />
      </Flex>
    </Flex>
  )
}

export default TotalEarningsAndChainSelect
