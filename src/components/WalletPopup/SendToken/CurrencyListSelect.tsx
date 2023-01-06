import { Currency, CurrencyAmount, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { memo } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Loader from 'components/Loader'
import { CurrencyRow } from 'components/SearchModal/CurrencyList'
import { useNativeBalance } from 'state/wallet/hooks'

const PanelTokenWrapper = styled.div`
  position: absolute;
  border-radius: 20px;
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.background};
  overflow-y: scroll;
  max-height: 250px;
  min-height: 100px;
  width: 300px;
  right: 10px;
  top: 85px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  padding: 10px 0px;
`

const NotifyWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.subText};
`
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
    <PanelTokenWrapper>
      {loading ? (
        <NotifyWrapper>
          <Flex alignItems="center" justifyContent="center" style={{ gap: '5px' }}>
            <Loader />
            <Text fontSize={12}>
              <Trans>Loading ...</Trans>
            </Text>
          </Flex>
        </NotifyWrapper>
      ) : !currencies.length ? (
        <NotifyWrapper>
          <Text fontSize={12}>
            <Trans>You don&apos;t have any balance token</Trans>
          </Text>
        </NotifyWrapper>
      ) : (
        currencies.map(currency => {
          const balance = currency.isNative ? ethBalance : currencyBalances[currency.wrapped.address]
          return (
            <CurrencyRow
              showFavoriteIcon={false}
              currency={currency}
              key={currency.wrapped.address}
              currencyBalance={balance as CurrencyAmount<Currency>}
              isSelected={Boolean(currency && selectedCurrency?.equals(currency))}
              onSelect={onCurrencySelect}
            />
          )
        })
      )}
    </PanelTokenWrapper>
  )
}

export default memo(CurrencyList)
