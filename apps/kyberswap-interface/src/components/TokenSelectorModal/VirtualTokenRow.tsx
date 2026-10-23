import { Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { motion } from 'framer-motion'
import React, { CSSProperties, memo } from 'react'
import { ListChildComponentProps } from 'react-window'

import Loader from 'components/Loader'
import { Center } from 'components/Stack'
import { TokenRow } from 'components/TokenSelectorModal/TokenRow'
import { Balance } from 'components/TokenSelectorModal/components'
import {
  BALANCE_COLUMN_CLASS,
  METRIC_COLUMN_CLASS,
  RESTRICTED_CONTENT_HEIGHT,
  ROW_CONTENT_HEIGHT,
} from 'components/TokenSelectorModal/constants'
import { TokenMetricColumn, TokenRowExtra, TokenRowExtraMap, tokenRowKey } from 'components/TokenSelectorModal/types'
import { getNeedsImport } from 'components/TokenSelectorModal/utils'
import { useERC8056DisplayBalance, useERC8056TokenInfo } from 'hooks/useERC8056Token'
import { restrictedTokenKey } from 'hooks/useRestrictedTokens'
import { getTokenAddress } from 'utils/tokenInfo'

// Data bag handed to every virtualized row through react-window's `itemData`. Delivering row data
// as a prop (rather than closing over it in an inline render-prop) keeps the row's element type
// stable, so background price/balance polls re-render rows cheaply instead of remounting them.
export type VirtualRowData = {
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

export const VirtualRow = memo(({ index, style, data }: ListChildComponentProps<VirtualRowData>) => {
  const currency = data.currencies[index]
  // The trailing slot (present while more pages can load) has no currency yet — show the loader.
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

  // Not whitelisted and not yet imported. Without `importAsRow` (Favorites, or while searching) the
  // right column becomes an Import button; with `importAsRow` (Trending / All, not searching) the row
  // stays normal — dimmed to 50% — and clicking it imports.
  const needsImport = getNeedsImport(currency, address => data.importedAddressSet.has(address), !!data.onImportToken)
  // A held token found by search keeps its balance column (dimmed, click imports) rather than turning
  // into an Import button: the balance is the very thing that tells the user this is the one they own.
  const held = !!data.heldAddresses?.has(getTokenAddress(currency))
  const importAsRow = needsImport && (!!data.importAsRow || held)
  const rightColumn = needsImport && !importAsRow ? 'import' : data.metricColumn ? 'metric' : 'balance'

  const isSelected = Boolean(data.selectedCurrency?.equals(currency))
  const otherSelected = Boolean(data.otherCurrency?.equals(currency))

  const favoriteTokenAddress = currency.isToken ? (currency as Token).address : undefined
  const isFavorite = favoriteTokenAddress ? data.favoriteAddressSet.has(favoriteTokenAddress.toLowerCase()) : false

  const currencyBalance = data.currencyBalances[index]
  const extra: TokenRowExtra | undefined = data.extras?.[tokenRowKey(currency.chainId, token.address)]
  // Non-All tabs already carry price in the catalog extras; only the All tab fetches Redux prices.
  const priceForUsd = data.showPriceColumn ? extra?.price ?? 0 : data.tokenPrices[token.address] || 0
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
        impersonator={data.impersonators?.has(token.address)}
        held={held}
      />
    </motion.div>
  )
})

VirtualRow.displayName = 'VirtualTokenRow'
