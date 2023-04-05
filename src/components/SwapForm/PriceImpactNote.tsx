import { Trans } from '@lingui/macro'
import { FC } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import WarningNote from 'components/WarningNote'
import { checkPriceImpact } from 'utils/prices'

const TextDashedColor = styled(Text)`
  border-bottom: 1px dashed ${({ theme }) => theme.text};
  width: fit-content;
`

const TextDashedTransparent = styled(Text)`
  border-bottom: 1px dashed transparent;
  width: fit-content;
`

const PRICE_IMPACT_EXPLANATION_URL =
  'https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/price-impact'

type Props = {
  isDegenMode?: boolean
  priceImpact: number | undefined
}

const PriceImpactNote: FC<Props> = ({ isDegenMode, priceImpact }) => {
  const priceImpactResult = checkPriceImpact(priceImpact)

  if (typeof priceImpact !== 'number') {
    return null
  }

  // invalid
  if (priceImpactResult.isInvalid) {
    return (
      <WarningNote
        level="serious"
        shortText={
          <Text>
            <Trans>Unable to calculate Price Impact</Trans>
          </Text>
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
                You can turn on <b>Degen Mode</b> from Settings to execute trades when price impact cannot be
                calculated. This can result in bad rates and loss of funds!
              </Trans>
            )}
          </Text>
        }
      />
    )
  }

  // VERY high
  if (priceImpactResult.isVeryHigh) {
    return (
      <WarningNote
        level="serious"
        shortText={
          <Row alignItems="center" style={{ gap: '0.5ch' }}>
            <Trans>
              <TextDashedColor>
                <MouseoverTooltip
                  placement="top"
                  width="fit-content"
                  text={
                    <Trans>
                      <Text fontSize={12}>
                        Read more{' '}
                        <a
                          href={PRICE_IMPACT_EXPLANATION_URL}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                        >
                          <b>here ↗</b>
                        </a>
                      </Text>
                    </Trans>
                  }
                >
                  Price Impact
                </MouseoverTooltip>
              </TextDashedColor>
              <TextDashedTransparent>
                {' '}
                is <b>very</b> high
              </TextDashedTransparent>
            </Trans>
          </Row>
        }
        longText={
          <Text>
            {isDegenMode ? (
              <Trans>
                You have turned on <b>Degen Mode</b> from settings. Trades with <b>very</b> high price impact can be
                executed.
              </Trans>
            ) : (
              <Trans>
                You can turn on <b>Degen Mode</b> from Settings to execute trades with <b>very</b> high price impact.
                This can result in bad rates and loss of funds!
              </Trans>
            )}
          </Text>
        }
      />
    )
  }

  // high

  const shortText = (
    <Row alignItems="center" style={{ gap: '0.5ch' }}>
      <Trans>
        <TextDashedColor>
          <MouseoverTooltip
            placement="top"
            width="fit-content"
            text={
              <Trans>
                <Text fontSize={12}>
                  Read more{' '}
                  <a href={PRICE_IMPACT_EXPLANATION_URL} target="_blank" rel="noreferrer">
                    <b>here ↗</b>
                  </a>
                </Text>
              </Trans>
            }
          >
            Price Impact
          </MouseoverTooltip>
        </TextDashedColor>
        <TextDashedTransparent> is high.</TextDashedTransparent>
      </Trans>
    </Row>
  )

  if (priceImpactResult.isHigh) {
    return <WarningNote shortText={shortText} />
  }

  return null
}

export default PriceImpactNote
