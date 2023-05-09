import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import EarningPieChart from 'components/EarningPieChart'
import useTheme from 'hooks/useTheme'
import { EarningsBreakdown } from 'types/myEarnings'

// TODO: remove transition of background when switching dark modes
type WrapperProps = { $columns: 1 | 2 }
const Wrapper = styled.div.attrs<WrapperProps>(({ $columns }) => ({
  'data-columns': $columns,
}))<WrapperProps>`
  width: 240px;
  flex: 0 0 240px;

  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 24px;
  background-color: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};

  transition: all 500ms ease, background 0s, border 0s, color 0s;

  &[data-columns='2'] {
    width: 400px;
    flex: 0 0 400px;
  }
`

const formatValue = (v: string | number) => {
  const formatter = Intl.NumberFormat('en-US', {
    notation: 'compact',
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return formatter.format(Number(v))
}

type Props = {
  isLoading?: boolean
  data?: EarningsBreakdown
  className?: string
}

const EarningsBreakdownPanel: React.FC<Props> = ({ isLoading, data, className }) => {
  const theme = useTheme()

  const numberOfTokens = data?.breakdowns.length || 0

  return (
    <Wrapper className={className} $columns={numberOfTokens > 5 ? 2 : 1}>
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
            <Trans>Tokens Breakdown</Trans>
          </Text>
        </Flex>
      </Flex>

      {isLoading || !data ? (
        <EarningPieChart isLoading />
      ) : (
        <EarningPieChart data={data.breakdowns} totalValue={formatValue(data.totalValue)} />
      )}
    </Wrapper>
  )
}

export default EarningsBreakdownPanel
