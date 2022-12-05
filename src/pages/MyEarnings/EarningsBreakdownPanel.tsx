import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import EarningPieChart from 'components/EarningPieChart'
import Loader from 'components/Loader'
import useTheme from 'hooks/useTheme'
import { EarningsBreakdown } from 'types/myEarnings'
import { formattedNumLong } from 'utils'

const Wrapper = styled.div`
  width: 320px;
  flex: 0 0 320px;

  display: flex;
  flex-direction: column;
  padding: 24px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
`

const formatValue = (v: string | number) => {
  const formatter = Intl.NumberFormat('en-US', {
    notation: 'compact',
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumSignificantDigits: 2,
  })

  return formatter.format(Number(v))
}

type Props = {
  isLoading?: boolean
  data?: EarningsBreakdown
}

const EarningsBreakdownPanel: React.FC<Props> = ({ isLoading, data }) => {
  const theme = useTheme()

  return (
    <Wrapper>
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <Flex
          sx={{
            width: '100%',
            justifyContent: 'space-between',
          }}
        >
          <Text
            sx={{
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              color: theme.subText,
            }}
          >
            <Trans>Total Earnings</Trans>
          </Text>

          <Text
            sx={{
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              color: theme.subText,
            }}
          >
            <Trans>Share</Trans>
          </Text>
        </Flex>

        <Text
          sx={{
            fontWeight: 500,
            fontSize: '32px',
            lineHeight: '36px',
            color: theme.text,
          }}
        >
          {isLoading || !data ? <Loader /> : formattedNumLong(data.totalValue, true)}
        </Text>
      </Flex>

      <Text
        as="span"
        sx={{
          fontWeight: 500,
          fontSize: '14px',
          lineHeight: '20px',
          marginTop: '24px',
          color: theme.subText,
        }}
      >
        <Trans>Earnings Breakdown</Trans>
      </Text>

      {isLoading || !data ? (
        <EarningPieChart isLoading />
      ) : (
        <EarningPieChart data={data.breakdowns} totalValue={formatValue(data.totalValue)} />
      )}
    </Wrapper>
  )
}

export default EarningsBreakdownPanel
