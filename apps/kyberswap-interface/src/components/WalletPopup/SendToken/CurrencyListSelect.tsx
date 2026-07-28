import { Currency, CurrencyAmount, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { memo } from 'react'

import Loader from 'components/Loader'
import { TokenRow } from 'components/TokenSelectorModal/TokenList'
import { useNativeBalance } from 'state/wallet/hooks'

function CurrencyList({
  selectedCurrency,
  onCurrencySelect,
  currencies,
  currencyBalances,
  loading,
}: {
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  currencies: Currency[]
  currencyBalances: { [address: string]: TokenAmount | undefined }
  loading: boolean
}) {
  const ethBalance = useNativeBalance()
  return (
    <div
      className={
        'absolute right-2.5 top-[85px] z-[2] flex max-h-[250px] min-h-[76px] w-[300px] flex-col items-center overflow-y-auto rounded-[20px] bg-background py-2.5 ' +
        '[&::-webkit-scrollbar-thumb]:border-r-[10px] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-disableText [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-3.5'
      }
    >
      {loading ? (
        <div className="flex flex-1 items-center text-subText">
          <div className="flex items-center justify-center gap-[5px]">
            <Loader />
            <span className="text-xs">
              <Trans>Loading ...</Trans>
            </span>
          </div>
        </div>
      ) : !currencies.length ? (
        <div className="flex flex-1 items-center text-subText">
          <span className="text-xs">
            <Trans>You don&apos;t have any balance token</Trans>
          </span>
        </div>
      ) : (
        currencies.map(currency => {
          const balance = currency.isNative ? ethBalance : currencyBalances[currency.wrapped.address]
          return (
            <TokenRow
              showFavoriteIcon={false}
              currency={currency}
              key={currency.wrapped.address + currency.symbol}
              currencyBalance={balance as CurrencyAmount<Currency>}
              isSelected={Boolean(currency && selectedCurrency?.equals(currency))}
              onSelect={onCurrencySelect}
            />
          )
        })
      )}
    </div>
  )
}

export default memo(CurrencyList)
