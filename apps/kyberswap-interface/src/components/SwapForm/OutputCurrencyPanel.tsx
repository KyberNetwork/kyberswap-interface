import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React from 'react'
import { useMedia } from 'react-use'

import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Skeleton from 'components/Skeleton'
import { TextHelper } from 'components/Text'
import { CHAINS_SUPPORT_FEE_CONFIGS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { WrapType } from 'hooks/useWrapCallback'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

type Props = {
  wrapType: WrapType
  parsedAmountIn: CurrencyAmount<Currency> | undefined
  parsedAmountOut: CurrencyAmount<Currency> | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  amountOutUsd: string | undefined
  balanceText?: string
  highlightToken?: boolean
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
  balanceText,
  highlightToken,
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
    return parsedAmountOut.toExact()
  }

  const getEstimatedUsd = () => {
    if (showWrap) {
      return undefined
    }

    return amountOutUsd ? formatDisplayNumber(amountOutUsd, { style: 'currency', significantDigits: 4 }) : undefined
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
        currency={currencyOut}
        onCurrencySelect={onChangeCurrencyOut}
        otherCurrency={currencyIn}
        id="swap-currency-output"
        dataTestId="swap-currency-output"
        showPinnedTokens={true}
        customBalanceText={balanceText}
        highlightCurrencySelect={highlightToken}
        estimatedUsd={routeLoading ? '' : getEstimatedUsd()}
        label={
          <TextHelper
            placement="right"
            tooltipWidth="200px"
            tooltip={
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
            fontSize={12}
            fontWeight={500}
            className="text-subText"
          >
            {CHAINS_SUPPORT_FEE_CONFIGS.includes(chainId) ? (
              <Trans>Est. Output (incl. fee)</Trans>
            ) : (
              <Trans>Est. Output</Trans>
            )}
          </TextHelper>
        }
        positionLabel="in"
        customChainId={customChainId}
        trackingSource="swap"
      />
    </div>
  )
}

export default OutputCurrencyPanel
