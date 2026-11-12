import { Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { motion } from 'framer-motion'
import React, { CSSProperties, memo } from 'react'
import { ListChildComponentProps } from 'react-window'

import Loader from 'components/Loader'
import { Center } from 'components/Stack'
import { AggregateBalances } from 'components/TokenSelectorModal/AllNetworks/types'
import { TokenRow } from 'components/TokenSelectorModal/TokenList/TokenRow'
import { Balance } from 'components/TokenSelectorModal/components'
import {
  BALANCE_COLUMN_CLASS,
  METRIC_COLUMN_CLASS,
  RESTRICTED_CONTENT_HEIGHT,
  ROW_CONTENT_HEIGHT,
} from 'components/TokenSelectorModal/constants'
import { TokenMetricColumn, TokenRowExtra, TokenRowExtraMap, tokenRowKey } from 'components/TokenSelectorModal/types'
import { getNeedsImport, isSameCurrency } from 'components/TokenSelectorModal/utils'
import { useERC8056DisplayBalance, useERC8056TokenInfo } from 'hooks/useERC8056Token'
import { restrictedTokenKey } from 'hooks/useRestrictedTokens'
import { getTokenAddress } from 'utils/tokenInfo'

// Data bag handed to every virtualized row through react-window's `itemData`. Delivering row data
// as a prop (rather than closing over it in an inline render-prop) keeps the row's element type
// stable, so background price/balance polls re-render rows cheaply instead of remounting them.
export type VirtualRowData = {
  aggregateBalances?: AggregateBalances
  allNetworks?: boolean
  currencies: Currency[]
  currencyBalances: (CurrencyAmount<Currency> | undefined)[]
  selectedCurrency?: Currency | null
  otherCurrency?: Currency | null
  scaleERC8056Balances?: boolean
  onCurrencySelect?: (currency: Currency) => void
  onImportToken?: (token: Token) => void
  onToggleFavorite?: (event: React.MouseEvent, currency: Currency) => void
  onRemoveImportedToken?: (token: Token) => void
  onShowTokenInfo?: (token: Token) => void
  showFavoriteIcon?: boolean
  itemStyle: CSSProperties
  showAddress?: boolean
  showCopyAddress?: boolean
  showPriceColumn?: boolean
  metricColumn?: TokenMetricColumn
  importAsRow?: boolean
  importedAddressSet: Set<string>
  tokenPrices: { [address: string]: number }
  account?: string | null
  favoriteAddressSet: Set<string>
  extras?: TokenRowExtraMap
  isTokenRestricted: (currency?: Currency | null) => boolean
  warnedKeys: Set<string>
  onWarnRestricted: (key: string) => void
  impersonators?: Set<string>
  heldAddresses?: Set<string>
  /** Whether a balance still missing is worth showing as loading; see `useBalanceWait`. */
  waitingForBalances?: boolean
  animateReorder?: boolean
}

const SelectedTokenBalance = ({ currency, balance }: { currency: Currency; balance: CurrencyAmount<Currency> }) => {
  const info = useERC8056TokenInfo(currency, currency.chainId)
  const displayBalance = useERC8056DisplayBalance(info, balance)

  return <Balance balance={displayBalance ?? balance} />
}

type RowProps = Omit<
  VirtualRowData,
  | 'currencies'
  | 'currencyBalances'
  | 'aggregateBalances'
  | 'importedAddressSet'
  | 'favoriteAddressSet'
  | 'heldAddresses'
  | 'impersonators'
  | 'tokenPrices'
  | 'extras'
> & {
  currency: Currency
  currencyBalance?: CurrencyAmount<Currency>
  extra?: TokenRowExtra
  priceForUsd: number
  needsImport: boolean
  held: boolean
  isFavorite: boolean
  impersonator?: boolean
  style: CSSProperties
}

const TokenVirtualRow = (data: RowProps) => {
  const { currency, currencyBalance, extra, priceForUsd, needsImport, held, isFavorite, style } = data
  const importAsRow = needsImport && (!!data.importAsRow || held)
  const rightColumn = needsImport && !importAsRow ? 'import' : data.metricColumn ? 'metric' : 'balance'

  const isSelected = isSameCurrency(data.selectedCurrency, currency)
  const otherSelected = isSameCurrency(data.otherCurrency, currency)

  const usdBalance = priceForUsd * parseFloat(currencyBalance?.toExact() || '0')
  const customBalance =
    data.scaleERC8056Balances && currency.isToken && currencyBalance && (isSelected || otherSelected) ? (
      <SelectedTokenBalance currency={currency} balance={currencyBalance} />
    ) : undefined

  const restrictedKey = restrictedTokenKey(currency.chainId, getTokenAddress(currency))
  const restricted = data.isTokenRestricted(currency)
  const warned = restricted && data.warnedKeys.has(restrictedKey)
  const rowStyle: CSSProperties = { height: warned ? RESTRICTED_CONTENT_HEIGHT : ROW_CONTENT_HEIGHT, ...data.itemStyle }

  return (
    <motion.div
      // Keep layout fixed and move on the compositor. A spring retains its current velocity when
      // another balance/price update changes the destination before the previous move finishes.
      style={{ ...style, top: 0 }}
      initial={false}
      animate={{ y: style.top ?? 0 }}
      transition={data.animateReorder ? { type: 'spring', stiffness: 400, damping: 40 } : { duration: 0 }}
    >
      <TokenRow
        showNetwork={data.allNetworks}
        isFavorite={isFavorite}
        showLoading={!!data.account && !!data.waitingForBalances}
        balanceUnknown={!!data.account}
        onToggleFavorite={data.onToggleFavorite}
        onRemoveImportedToken={data.onRemoveImportedToken}
        style={rowStyle}
        currency={currency}
        currencyBalance={currencyBalance}
        customBalance={customBalance}
        isSelected={isSelected}
        showFavoriteIcon={data.showFavoriteIcon}
        // Favoriting is for tokens the user has taken on; a row that still has to be imported offers
        // the import and nothing else.
        canFavorite={!needsImport}
        onSelect={data.onCurrencySelect}
        otherSelected={otherSelected}
        onShowTokenInfo={data.onShowTokenInfo}
        usdBalance={usdBalance}
        usdValueClassName="text-primary"
        priceUsd={extra?.price}
        priceChange24h={extra?.priceChange24h}
        metricValue={data.metricColumn ? extra?.[data.metricColumn] : undefined}
        addedAt={extra?.addedAt}
        showAddress={data.showAddress}
        showCopyAddress={data.showCopyAddress}
        showPriceColumn={data.showPriceColumn}
        rightColumn={rightColumn}
        rightColumnClassName={data.metricColumn ? METRIC_COLUMN_CLASS : BALANCE_COLUMN_CLASS}
        importOnClick={importAsRow}
        onImportToken={data.onImportToken}
        restricted={restricted}
        warned={warned}
        onRestrictedClick={() => data.onWarnRestricted(restrictedKey)}
        impersonator={data.impersonator}
        held={held}
      />
    </motion.div>
  )
}

const MemoTokenVirtualRow = memo(TokenVirtualRow)

// Normalize the two sources once at the row boundary. Rows receive only their own values;
// All Networks and single-chain views have separate identities so switching starts at the new position.
export const VirtualRow = ({ index, style, data }: ListChildComponentProps<VirtualRowData>) => {
  const {
    currencies,
    currencyBalances,
    aggregateBalances,
    importedAddressSet,
    favoriteAddressSet,
    heldAddresses,
    impersonators,
    tokenPrices,
    extras,
    ...shared
  } = data

  const currency = currencies[index]
  if (!currency) {
    return (
      <div style={style} data-testid="token-list-load-more">
        <Center className="h-12">
          <Loader size="20px" />
        </Center>
      </div>
    )
  }

  const token = currency.wrapped
  const rowKey = tokenRowKey(currency.chainId, getTokenAddress(currency))
  const observation = data.allNetworks ? aggregateBalances?.[rowKey] : undefined
  const extra = extras?.[tokenRowKey(currency.chainId, token.address)]
  const price = data.allNetworks ? observation?.price : tokenPrices[token.address]

  return (
    <MemoTokenVirtualRow
      key={data.allNetworks ? 'all' : 'chain'}
      {...shared}
      style={style}
      currency={currency}
      currencyBalance={data.allNetworks ? observation?.balance : currencyBalances[index]}
      extra={extra}
      priceForUsd={data.showPriceColumn ? extra?.price ?? 0 : price ?? 0}
      needsImport={getNeedsImport(
        currency,
        address => importedAddressSet.has(tokenRowKey(currency.chainId, address)),
        !!data.onImportToken,
      )}
      held={!!heldAddresses?.has(data.allNetworks ? rowKey : getTokenAddress(currency))}
      isFavorite={currency.isToken && favoriteAddressSet.has(tokenRowKey(currency.chainId, token.address))}
      impersonator={data.allNetworks ? observation?.impersonator : impersonators?.has(token.address)}
      waitingForBalances={data.allNetworks ? observation?.waiting ?? !!aggregateBalances : data.waitingForBalances}
    />
  )
}
