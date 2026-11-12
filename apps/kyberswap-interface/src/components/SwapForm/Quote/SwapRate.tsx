import { Trans } from '@lingui/macro'
import { type ReactNode, useState } from 'react'
import { Repeat } from 'react-feather'
import { getNetworkInfo } from 'services/crossChain/utils'

import RefreshIndicator, { type RefreshIndicatorProps } from 'components/RefreshLoading/RefreshIndicator'
import Skeleton from 'components/Skeleton'
import { HStack } from 'components/Stack'
import type { Chain, Currency } from 'types/crossChain'

type Props = {
  currencyIn?: Currency
  currencyOut?: Currency
  inputChain?: Chain
  outputChain?: Chain
  rate?: string
  invertedRate?: string
  loading: boolean
  refresh?: RefreshIndicatorProps
  routes?: ReactNode
}

/** Shared rate presentation; each flow owns quote loading and refresh scheduling. */
export const SwapRate = ({
  currencyIn,
  currencyOut,
  inputChain,
  outputChain,
  rate,
  invertedRate,
  loading,
  refresh,
  routes,
}: Props) => {
  const [inverted, setInverted] = useState(false)
  const baseCurrency = inverted ? currencyOut : currencyIn
  const quoteCurrency = inverted ? currencyIn : currencyOut
  const baseChain = inverted ? outputChain : inputChain
  const quoteChain = inverted ? inputChain : outputChain
  const value = inverted ? invertedRate : rate
  const hasValue = Boolean(value && baseCurrency && quoteCurrency && baseChain && quoteChain)

  return (
    <HStack className="min-h-6 min-w-0 items-center justify-between gap-2 text-xs">
      <HStack className="min-w-0 items-center gap-2">
        <span className="shrink-0 font-normal text-subText">
          <Trans>Rate</Trans>
        </span>
        <HStack className="min-w-0 items-center gap-1 font-medium text-text">
          {loading && !hasValue ? (
            <Skeleton width={128} height={14} />
          ) : hasValue && baseChain && quoteChain ? (
            <>
              {refresh && <RefreshIndicator {...refresh} size={24} clickable />}
              <button
                type="button"
                onClick={() => setInverted(value => !value)}
                className="flex min-w-0 cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-xs font-medium text-text"
              >
                <span className="inline-flex min-w-0 items-center gap-1 whitespace-nowrap">
                  1
                  <span className="relative inline-flex min-w-0 pr-3">
                    <span className="truncate">{baseCurrency?.symbol}</span>
                    <img
                      src={getNetworkInfo(baseChain).icon}
                      alt={getNetworkInfo(baseChain).name}
                      className="absolute -top-0.5 right-0 size-[10px] rounded-full"
                    />
                  </span>
                </span>
                <span className="shrink-0">=</span>
                <span className="inline-flex min-w-0 items-center gap-1 whitespace-nowrap">
                  {value}
                  <span className="relative inline-flex min-w-0 pr-3">
                    <span className="truncate">{quoteCurrency?.symbol}</span>
                    <img
                      src={getNetworkInfo(quoteChain).icon}
                      alt={getNetworkInfo(quoteChain).name}
                      className="absolute -top-0.5 right-0 size-[10px] rounded-full"
                    />
                  </span>
                </span>
                <Repeat size={14} className="shrink-0 text-subText" />
              </button>
            </>
          ) : (
            <span>--</span>
          )}
        </HStack>
      </HStack>
      {routes && <div className="shrink-0">{routes}</div>}
    </HStack>
  )
}
