import { Trans } from '@lingui/macro'
import { Text } from 'rebass'
import styled from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import useTheme from 'hooks/useTheme'
import { formattedNum } from 'utils'

const getPercentString = (p?: number) => {
  if (!p) {
    return ''
  }

  if (p < 0.01) {
    return '<0.01%'
  }

  return `${p.toFixed(2)}%`
}

const Wrapper = styled.div`
  position: absolute;
  align-items: center;
  display: flex;
  top: 12px;
  left: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.apr};
  font-size: 0.75rem;
  z-index: 2;
`

type Props = {
  usd?: string
  percent?: number
  dexName?: string
}

const TradeComparisonNote: React.FC<Props> = ({ usd, percent, dexName }) => {
  const theme = useTheme()

  if (usd && dexName) {
    const usdValue = formattedNum(usd, true)
    const percentStr = getPercentString(percent)
    return (
      <Wrapper>
        <Trans>You save</Trans> {usdValue} {percentStr && `(${percentStr})`}
        <InfoHelper
          text={
            <Text>
              <Trans>
                The amount you save compared to{' '}
                <Text as="span" color={theme.warning}>
                  {dexName}
                </Text>
                .
              </Trans>{' '}
              <Trans>
                <Text color={theme.primary} fontWeight={500} as="span">
                  KyberSwap
                </Text>{' '}
                gets you the best token rates
              </Trans>
            </Text>
          }
          size={14}
          color={theme.apr}
        />
      </Wrapper>
    )
  }

  return null
}

export default TradeComparisonNote
