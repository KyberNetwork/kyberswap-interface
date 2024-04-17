import { Trans } from '@lingui/macro'
import { FC } from 'react'
import { isMobile } from 'react-device-detect'
import { useSearchParams } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import Row from 'components/Row'
import WarningNote from 'components/WarningNote'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useSwitchPairToLimitOrder } from 'state/swap/hooks'
import { StyledInternalLink } from 'theme'
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

  const limitOrderLink = (
    <Text
      sx={{ cursor: 'pointer' }}
      as={'u'}
      onClick={() => {
        mixpanelHandler(MIXPANEL_TYPE.LO_CLICK_WARNING_IN_SWAP)
        switchToLimitOrder()
      }}
    >
      Limit Order
    </Text>
  )

  // VERY high
  if (priceImpactResult.isVeryHigh) {
    return (
      <WarningNote
        level="serious"
        shortText={
          <Text alignItems="center" style={{ gap: '0.5ch' }}>
            <Trans>
              <span>
                <TextUnderlineColor
                  as="a"
                  href={PRICE_IMPACT_EXPLANATION_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Price Impact
                </TextUnderlineColor>
              </span>{' '}
              is very high. You will lose funds!
            </Trans>
          </Text>
        }
        longText={
          <Text>
            {isDegenMode ? (
              <Trans>
                You have turned on Degen Mode from settings. Trades with very high price impact can be executed
              </Trans>
            ) : showLimitOrderLink ? (
              <Trans>
                You can turn on Degen Mode from Settings to execute trades with very high price impact or Place a{' '}
                {limitOrderLink}. This can result in bad rates and loss of funds
              </Trans>
            ) : (
              <Trans>
                You can turn on Degen Mode from Settings to execute trades with very high price impact. This can result
                in bad rates and loss of funds
              </Trans>
            )}
          </Text>
        }
      />
    )
  }

  // high
  if (showLimitOrderLink && !!priceImpact && priceImpact > 1) {
    return (
      <WarningNote
        shortText={
          <Text>
            <Trans>
              Price Impact is high. Please consider placing a {!isMobile ? <br /> : null}
              {limitOrderLink} to soften the price impact.
            </Trans>
          </Text>
        }
      />
    )
  }

  if (priceImpactResult.isHigh) {
    return (
      <WarningNote
        shortText={
          <Row alignItems="center" style={{ gap: '0.5ch' }}>
            <Trans>
              <TextUnderlineColor as="a" href={PRICE_IMPACT_EXPLANATION_URL} target="_blank" rel="noreferrer">
                Price Impact
              </TextUnderlineColor>
              <TextUnderlineTransparent>is high</TextUnderlineTransparent>
            </Trans>
          </Row>
        }
      />
    )
  }

  return null
}

export const ZapHighPriceImpact = ({ showInPopup }: { showInPopup?: boolean }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  return (
    <WarningNote
      level="serious"
      shortText={
        <Text>
          <Trans>
            <TextUnderlineColor as="a" href={PRICE_IMPACT_EXPLANATION_URL} target="_blank" rel="noreferrer noopener">
              Price Impact
            </TextUnderlineColor>{' '}
            is very high. You will lose funds!{' '}
            {showInPopup ? (
              <Text>
                You have turned on Degen Mode from settings. Trades with very high price impact can be executed
              </Text>
            ) : (
              <>
                Please turn on{' '}
                <StyledInternalLink
                  to="link is not important here"
                  onClick={e => {
                    e.preventDefault()
                    searchParams.set('showSetting', 'true')
                    setSearchParams(searchParams)
                  }}
                >
                  Degen Mode ↗
                </StyledInternalLink>
              </>
            )}
          </Trans>
        </Text>
      }
    />
  )
}

export default PriceImpactNote
