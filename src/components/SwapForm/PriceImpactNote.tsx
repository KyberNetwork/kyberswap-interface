import { Trans, t } from '@lingui/macro'
import { AlertTriangle } from 'react-feather'
import { useSelector } from 'react-redux'
import styled, { useTheme } from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import { AppState } from 'state'
import { useExpertModeManager } from 'state/user/hooks'

import { isHighPriceImpact, isInvalidPriceImpact, isVeryHighPriceImpact } from './utils'

const Wrapper = styled.div<{ veryHigh?: boolean }>`
  margin-top: 28px;
  padding: 12px 16px;

  display: flex;
  align-items: center;

  border-radius: 999px;
  color: ${({ theme, veryHigh }) => (veryHigh ? theme.red : theme.warning)};
  background: ${({ theme, veryHigh }) => (veryHigh ? `${theme.red}66` : `${theme.warning}66`)};
  font-size: 12px;
`

const PriceImpactNote: React.FC = () => {
  const theme = useTheme()
  const priceImpact = useSelector((state: AppState) => state.swap.routeSummary?.priceImpact)
  const [isExpertMode] = useExpertModeManager()

  const renderInfoHelper = () => {
    return (
      <InfoHelper
        text={
          isExpertMode
            ? t`You have turned on Advanced Mode from settings. Trades with high price impact can be executed`
            : t`Turn on Advanced Mode from settings to execute trades with high price impact`
        }
        color={theme.text}
      />
    )
  }

  if (priceImpact === undefined) {
    return null
  }

  // invalid
  if (isInvalidPriceImpact(priceImpact)) {
    return (
      <Wrapper>
        <AlertTriangle color={theme.warning} size={16} style={{ marginRight: '10px' }} />
        <Trans>Unable to calculate Price Impact</Trans>
        <InfoHelper text={t`Turn on Advanced Mode to trade`} color={theme.text} />
      </Wrapper>
    )
  }

  if (isHighPriceImpact(priceImpact)) {
    const veryHigh = isVeryHighPriceImpact(priceImpact)

    return (
      <Wrapper veryHigh={veryHigh}>
        <AlertTriangle size={16} style={{ marginRight: '10px' }} />
        {veryHigh ? <Trans>Price Impact is Very High</Trans> : <Trans>Price Impact is High</Trans>}
        {renderInfoHelper()}
      </Wrapper>
    )
  }

  return null
}

export default PriceImpactNote
