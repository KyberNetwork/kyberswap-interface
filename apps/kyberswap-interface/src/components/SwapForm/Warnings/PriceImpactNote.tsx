import { Trans } from '@lingui/macro'
import { isMobile } from 'react-device-detect'

import { ErrorWarning } from 'components/ErrorWarning'
import { HStack } from 'components/Stack'
import { isSupportLimitOrder } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useSwitchPairToLimitOrder } from 'state/swap/hooks'
import { cn } from 'utils/cn'
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
  <Component {...rest} className={cn('w-fit cursor-pointer border-b border-text-60 font-medium text-text', className)}>
    {children}
  </Component>
)

const TextUnderlineTransparent = ({ children }: { children: React.ReactNode }) => (
  <span className="w-fit cursor-pointer border-b border-solid border-transparent">{children}</span>
)

export const PRICE_IMPACT_EXPLANATION_URL =
  'https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/price-impact'

const LimitOrderLink = () => {
  const switchToLimitOrder = useSwitchPairToLimitOrder()
  const { trackingHandler } = useTracking()

  const handleClick = () => {
    trackingHandler(TRACKING_EVENT_TYPE.LO_CLICK_WARNING_IN_SWAP)
    switchToLimitOrder()
  }

  return (
    <span
      className="cursor-pointer border-b border-border-primary text-primary hover:brightness-125"
      onClick={handleClick}
    >
      <Trans>Limit Order</Trans>
    </span>
  )
}

type Props = {
  isDegenMode?: boolean
  priceImpact: number | undefined | null
  showLimitOrderLink?: boolean
}

const PriceImpactNote = ({ isDegenMode, priceImpact, showLimitOrderLink = false }: Props) => {
  const { chainId } = useActiveWeb3React()
  const priceImpactResult = checkPriceImpact(priceImpact)

  if (typeof priceImpact !== 'number') {
    return null
  }
  if (priceImpactResult.isInvalid) {
    return (
      <ErrorWarning
        type="error"
        title={
          <span>
            <Trans>
              Unable to calculate{' '}
              <TextUnderlineColor as="a" href={PRICE_IMPACT_EXPLANATION_URL} target="_blank" rel="noreferrer noopener">
                Price Impact
              </TextUnderlineColor>
              .
            </Trans>{' '}
            {!isDegenMode ? (
              <span>
                <Trans>
                  Consider requesting a <LimitOrderLink /> instead, or click &apos;Swap Anyway&apos; if you wish to
                  continue by enabling Degen Mode.
                </Trans>
              </span>
            ) : (
              ''
            )}
          </span>
        }
        desc={
          isDegenMode ? (
            <div>
              <Trans>
                You have turned on <b>Degen Mode</b> from settings. Trades can still be executed when price impact
                cannot be calculated.
              </Trans>
            </div>
          ) : undefined
        }
      />
    )
  }

  if (priceImpactResult.isVeryHigh) {
    return (
      <ErrorWarning
        type="error"
        title={
          <div className="flex items-center gap-[0.5ch]">
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
        desc={
          <div>
            {isDegenMode ? (
              <Trans>
                You have turned on Degen Mode from settings. Trades with very high price impact can be executed
              </Trans>
            ) : showLimitOrderLink ? (
              <Trans>
                You can turn on Degen Mode from Settings to execute trades with very high price impact or Place a{' '}
                <LimitOrderLink />. This can result in bad rates and loss of funds
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
      <ErrorWarning
        type="warn"
        title={
          <div>
            <Trans>
              Price Impact is high. Please consider placing a {!isMobile ? <br /> : null}
              <LimitOrderLink /> to soften the price impact.
            </Trans>
          </div>
        }
      />
    )
  }

  if (priceImpactResult.isHigh) {
    return (
      <ErrorWarning
        type="warn"
        title={
          <HStack className="w-full items-center gap-[0.5ch]">
            <Trans>
              <TextUnderlineColor as="a" href={PRICE_IMPACT_EXPLANATION_URL} target="_blank" rel="noreferrer">
                Price Impact
              </TextUnderlineColor>
              <TextUnderlineTransparent>is high</TextUnderlineTransparent>
            </Trans>
          </HStack>
        }
      />
    )
  }

  return null
}

export default PriceImpactNote
