import { Trans } from '@lingui/macro'
import { FC } from 'react'
import { isMobile } from 'react-device-detect'

import Row from 'components/Row'
import WarningNote from 'components/WarningNote'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useSwitchPairToLimitOrder } from 'state/swap/hooks'
import { isSupportLimitOrder } from 'utils'
import { checkPriceImpact } from 'utils/prices'

type TextUnderlineColorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  as?: React.ElementType
}

export const TextUnderlineColor = ({
  children,
  as: Component = 'span',
  className,
  ...rest
}: TextUnderlineColorProps) => (
  <Component
    {...rest}
    className={`w-fit cursor-pointer border-b border-solid border-text font-medium text-text ${className ?? ''}`}
  >
    {children}
  </Component>
)

const TextUnderlineTransparent = ({ children }: { children: React.ReactNode }) => (
  <span className="w-fit cursor-pointer border-b border-solid border-transparent">{children}</span>
)

export const PRICE_IMPACT_EXPLANATION_URL =
  'https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/price-impact'

type Props = {
  isDegenMode?: boolean
  priceImpact: number | undefined | null
  showLimitOrderLink?: boolean
}

const PriceImpactNote: FC<Props> = ({ isDegenMode, priceImpact, showLimitOrderLink = false }) => {
  const { chainId } = useActiveWeb3React()
  const priceImpactResult = checkPriceImpact(priceImpact)
  const switchToLimitOrder = useSwitchPairToLimitOrder()
  const { trackingHandler } = useTracking()

  if (typeof priceImpact !== 'number') {
    return null
  }
  const limitOrderLink = (
    <u
      className="cursor-pointer text-primary"
      onClick={() => {
        trackingHandler(TRACKING_EVENT_TYPE.LO_CLICK_WARNING_IN_SWAP)
        switchToLimitOrder()
      }}
    >
      <Trans>Limit Order</Trans>
    </u>
  )

  if (priceImpactResult.isInvalid) {
    return (
      <WarningNote
        level="serious"
        shortText={
          <span>
            <Trans>
              Unable to calculate{' '}
              <TextUnderlineColor as="a" href={PRICE_IMPACT_EXPLANATION_URL} target="_blank" rel="noreferrer noopener">
                Price Impact
              </TextUnderlineColor>
              {'. '}
            </Trans>
            {!isDegenMode ? (
              <span>
                <Trans>
                  {' '}
                  Consider requesting a {limitOrderLink} instead, or click &apos;Swap Anyway&apos; if you wish to
                  continue by enabling Degen Mode.
                </Trans>
              </span>
            ) : (
              ''
            )}
          </span>
        }
        longText={
          isDegenMode ? (
            <div>
              {isDegenMode ? (
                <Trans>
                  You have turned on <b>Degen Mode</b> from settings. Trades can still be executed when price impact
                  cannot be calculated.
                </Trans>
              ) : (
                <Trans>
                  Consider requesting a {limitOrderLink} instead, or click &apos;Swap Anyway&apos; if you wish to
                  continue by enabling Degen Mode.
                </Trans>
              )}
            </div>
          ) : undefined
        }
      />
    )
  }

  if (priceImpactResult.isVeryHigh) {
    return (
      <WarningNote
        level="serious"
        shortText={
          <div className="flex items-center" style={{ gap: '0.5ch' }}>
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
          </div>
        }
        longText={
          <div>
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
          </div>
        }
      />
    )
  }

  if (showLimitOrderLink && !!priceImpact && priceImpact > 1 && isSupportLimitOrder(chainId)) {
    return (
      <WarningNote
        shortText={
          <div>
            <Trans>
              Price Impact is high. Please consider placing a {!isMobile ? <br /> : null}
              {limitOrderLink} to soften the price impact.
            </Trans>
          </div>
        }
      />
    )
  }

  if (priceImpactResult.isHigh) {
    return (
      <WarningNote
        shortText={
          <Row className="items-center gap-[0.5ch]">
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

export default PriceImpactNote
