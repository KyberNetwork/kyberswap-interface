import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { CSSProperties, memo, useCallback } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import { formatPoolValue } from 'pages/Bridge/helpers'
import { MultiChainTokenInfo } from 'pages/Bridge/type'
import { useBridgeState } from 'state/crossChain/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useCurrencyBalances } from 'state/wallet/hooks'

import { CurrencyRow, getDisplayTokenInfo } from '../CurrencyList'

interface TokenRowPropsBridge {
  currency: WrappedTokenInfo | undefined
  currencyBalance: CurrencyAmount<Currency>
  style: CSSProperties
}
const EMPTY_ARRAY: WrappedTokenInfo[] = []
const CurrencyListBridge = memo(function CurrencyListV2({
  currencies,
  isOutput,
  onCurrencySelect,
  listTokenRef,
  isCrossChain,
  currency: selectedCurrency,
  chainId,
}: {
  currencies: WrappedTokenInfo[]
  onCurrencySelect: (currency: WrappedTokenInfo) => void
  isOutput: boolean | undefined
  listTokenRef: React.Ref<HTMLDivElement>
  isCrossChain?: boolean
  currency: WrappedTokenInfo | undefined
  chainId: ChainId | undefined
}) {
  const [{ tokenInfoOut, poolValueOutMap }] = useBridgeState()
  // todo refactor
  const currencyBalances = useCurrencyBalances(!isOutput || isCrossChain ? currencies : EMPTY_ARRAY, chainId)
  const theme = useTheme()

  const Row: any = useCallback(
    function TokenRow({ style, currency, currencyBalance }: TokenRowPropsBridge) {
      if (!currency) return
      const isSelected = isOutput
        ? tokenInfoOut?.sortId === currency?.multichainInfo?.sortId
        : selectedCurrency?.equals(currency)
      const handleSelect = () => onCurrencySelect(currency)
      const { symbol } = getDisplayTokenInfo(currency)
      const { sortId, type, anytoken } = (currency?.multichainInfo || {}) as Partial<MultiChainTokenInfo>
      const poolLiquidity = isOutput ? formatPoolValue(poolValueOutMap?.[anytoken?.address ?? '']) : undefined
      return (
        <CurrencyRow
          showFavoriteIcon={false}
          style={style}
          currency={currency}
          currencyBalance={currencyBalance}
          isSelected={!!isSelected}
          onSelect={handleSelect}
          otherSelected={false}
          customBalance={poolLiquidity}
          customName={
            sortId !== undefined ? (
              <Flex>
                {symbol}&nbsp;
                <Text color={theme.subText} fontWeight="normal">
                  {`${['swapin', 'swapout'].includes(type ?? '') ? '(Bridge)' : `(Router ${sortId})`}`}
                </Text>
              </Flex>
            ) : null
          }
        />
      )
    },
    [onCurrencySelect, isOutput, tokenInfoOut, theme, poolValueOutMap, selectedCurrency],
  )

  return (
    <div style={{ flex: '1', overflow: 'hidden', height: '100%' }}>
      {currencies.length < 10 ? (
        currencies.map((item, index) => (
          <Row index={index} currency={item} key={index} currencyBalance={currencyBalances[index]} />
        ))
      ) : (
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemSize={56}
              itemCount={currencies.length}
              itemData={currencies}
              outerRef={listTokenRef}
            >
              {({ data, index, style }) => (
                <Row
                  index={index}
                  currency={data[index]}
                  key={data[index]?.address || index}
                  currencyBalance={currencyBalances[index]}
                  style={style}
                />
              )}
            </FixedSizeList>
          )}
        </AutoSizer>
      )}
    </div>
  )
})
export default CurrencyListBridge
