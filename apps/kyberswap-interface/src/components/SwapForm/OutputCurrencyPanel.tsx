import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React from 'react'
import { useMedia } from 'react-use'

import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Skeleton from 'components/Skeleton'
import { MouseoverTooltip } from 'components/Tooltip'
import { CHAINS_SUPPORT_FEE_CONFIGS, RESERVE_USD_DECIMALS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { WrapType } from 'hooks/useWrapCallback'
import { MEDIA_WIDTHS } from 'theme'
import { formattedNum } from 'utils'
import { cn } from 'utils/cn'

export const Label: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div {...props} className={cn('border-b border-dashed border-border text-xs font-medium text-subText', className)}>
    {children}
  </div>
)

type Props = {
  wrapType: WrapType
  parsedAmountIn: CurrencyAmount<Currency> | undefined
  parsedAmountOut: CurrencyAmount<Currency> | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  amountOutUsd: string | undefined

  onChangeCurrencyOut: (c: Currency) => void
  customChainId?: ChainId
  routeLoading: boolean
}

const OutputCurrencyPanel: React.FC<Props> = ({
  wrapType,
  parsedAmountIn,
  parsedAmountOut,
  currencyIn,
  currencyOut,
  amountOutUsd,
  onChangeCurrencyOut,
  customChainId,
  routeLoading,
}) => {
  const { chainId: walletChainId } = useActiveWeb3React()
  const chainId = customChainId || walletChainId

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  // showWrap = true if this swap is either WRAP or UNWRAP
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE

  const getFormattedAmount = () => {
    if (showWrap) {
      return parsedAmountIn?.toExact() || ''
    }
    if (!parsedAmountOut) return ''
    return parsedAmountOut.toSignificant(RESERVE_USD_DECIMALS)
  }

  const getEstimatedUsd = () => {
    if (showWrap) {
      return undefined
    }

    return amountOutUsd ? `${formattedNum(amountOutUsd.toString(), true)}` : undefined
  }

  return (
    <div className="relative">
      {routeLoading && (
        <div className="absolute bottom-[18px] left-3 z-10 flex">
          <Skeleton height={24} width={upToSmall ? 120 : 160} />
        </div>
      )}
      <CurrencyInputPanel
        disabledInput
        value={routeLoading ? ' ' : getFormattedAmount()}
        onMax={null}
        onHalf={null}
        currency={currencyOut}
        onCurrencySelect={onChangeCurrencyOut}
        otherCurrency={currencyIn}
        id="swap-currency-output"
        dataTestId="swap-currency-output"
        showPinnedTokens={true}
        estimatedUsd={routeLoading ? '' : getEstimatedUsd()}
        label={
          <Label>
            <MouseoverTooltip
              placement="right"
              width="200px"
              text={
                <span className="text-xs">
                  {CHAINS_SUPPORT_FEE_CONFIGS.includes(chainId) ? (
                    <Trans>
                      This is the estimated output amount. It is inclusive of any applicable swap fees. Do review the
                      actual output amount at the confirmation stage.
                    </Trans>
                  ) : (
                    <Trans>
                      This is the estimated output amount. Do review the actual output amount at the confirmation stage.
                    </Trans>
                  )}
                </span>
              }
            >
              {CHAINS_SUPPORT_FEE_CONFIGS.includes(chainId) ? (
                <Trans>Est. Output (incl. fee)</Trans>
              ) : (
                <Trans>Est. Output</Trans>
              )}
            </MouseoverTooltip>
          </Label>
        }
        positionLabel="in"
        customChainId={customChainId}
        trackingSource="swap"
      />
    </div>
  )
}

export default OutputCurrencyPanel
