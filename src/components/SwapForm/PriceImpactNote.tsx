import { Trans } from '@lingui/macro'
import { FC } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import Column from 'components/Column'
import Row from 'components/Row'
import WarningNote from 'components/WarningNote'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useSwitchPairToLimitOrder } from 'state/swap/hooks'
import { checkPriceImpact } from 'utils/prices'

export const TextUnderlineColor = styled(Text)`
  border-bottom: 1px solid ${({ theme }) => theme.text};
  width: fit-content;
  cursor: pointer;
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`

const TextUnderlineTransparent = styled(Text)`
  border-bottom: 1px solid transparent;
  width: fit-content;
  cursor: pointer;
`

export const PRICE_IMPACT_EXPLANATION_URL =
  'https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/price-impact'

type Props = {
  isDegenMode?: boolean
  priceImpact: number | undefined | null
  showLimitOrderLink?: boolean
}

const PriceImpactNote: FC<Props> = ({ isDegenMode, priceImpact, showLimitOrderLink = false }) => {
  const priceImpactResult = checkPriceImpact(priceImpact)
  const theme = useTheme()
  const switchToLimitOrder = useSwitchPairToLimitOrder()
  const { mixpanelHandler } = useMixpanel()

  if (typeof priceImpact !== 'number') {
    return null
  }

  // invalid
  if (priceImpactResult.isInvalid) {
    return (
      <WarningNote
        level="serious"
        shortText={
          <Row alignItems="center" style={{ gap: '0.5ch' }}>
            <Trans>
              <TextUnderlineTransparent>Unable to calculate</TextUnderlineTransparent>
              <TextUnderlineColor as="a" href={PRICE_IMPACT_EXPLANATION_URL} target="_blank" rel="noreferrer noopener">
                Price Impact
              </TextUnderlineColor>
            </Trans>
          </Row>
        }
        longText={
          <Text>
            {isDegenMode ? (
              <Trans>
                You have turned on <b>Degen Mode</b> from settings. Trades can still be executed when price impact
                cannot be calculated.
              </Trans>
            ) : (
              <Trans>
                You can turn on Degen Mode from Settings to execute trades when price impact cannot be calculated. This
                can result in bad rates and loss of funds!
              </Trans>
            )}
          </Text>
        }
      />
    )
  }

  const limitOrderNote = showLimitOrderLink ? (
    <Text>
      <Trans>
        Do you want to make a{' '}
        <Text
          as="b"
          sx={{ cursor: 'pointer' }}
          color={theme.primary}
          onClick={() => {
            mixpanelHandler(MIXPANEL_TYPE.LO_CLICK_WARNING_IN_SWAP)
            switchToLimitOrder()
          }}
        >
          Limit Order
        </Text>{' '}
        instead?
      </Trans>
    </Text>
  ) : undefined

  // VERY high
  if (priceImpactResult.isVeryHigh) {
    return (
      <WarningNote
        level="serious"
        shortText={
          <Row alignItems="center" style={{ gap: '0.5ch' }}>
            <Trans>
              <TextUnderlineColor as="a" href={PRICE_IMPACT_EXPLANATION_URL} target="_blank" rel="noreferrer noopener">
                Price Impact
              </TextUnderlineColor>
              <TextUnderlineTransparent>is very high. You will lose funds!</TextUnderlineTransparent>
            </Trans>
          </Row>
        }
        longText={
          <Column gap="4px">
            {limitOrderNote}
            <Text>
              {isDegenMode ? (
                <Trans>
                  You have turned on Degen Mode from settings. Trades with very high price impact can be executed
                </Trans>
              ) : (
                <Trans>
                  You can turn on Degen Mode from Settings to execute trades with very high price impact. This can
                  result in bad rates and loss of funds
                </Trans>
              )}
            </Text>
          </Column>
        }
      />
    )
  }

  // high

  const shortText = (
    <Row alignItems="center" style={{ gap: '0.5ch' }}>
      <Trans>
        <TextUnderlineColor as="a" href={PRICE_IMPACT_EXPLANATION_URL} target="_blank" rel="noreferrer">
          Price Impact
        </TextUnderlineColor>
        <TextUnderlineTransparent>is high</TextUnderlineTransparent>
      </Trans>
    </Row>
  )

  if (priceImpactResult.isHigh) {
    return <WarningNote shortText={shortText} longText={limitOrderNote} />
  }

  return null
}

export default PriceImpactNote
