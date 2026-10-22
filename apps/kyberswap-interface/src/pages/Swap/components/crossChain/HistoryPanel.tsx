import { t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { ChevronLeft, Search, X } from 'react-feather'

import IconButton from 'components/Button/IconButton'
import Input from 'components/Input'
import { HStack, Stack } from 'components/Stack'
import type { Currency } from 'pages/CrossChainSwap/adapters/types'
import { TransactionHistoryList } from 'pages/CrossChainSwap/components/TransactionHistory'
import { useCrossChainTransactions } from 'state/crossChainSwap'

const matchesToken = (token: Currency, query: string) => {
  const fields = [
    token.symbol,
    'name' in token ? token.name : undefined,
    'address' in token ? token.address : undefined,
    'id' in token ? token.id : undefined,
    'assetId' in token ? token.assetId : undefined,
    'contractAddress' in token ? token.contractAddress : undefined,
  ]
  return fields.some(value => value?.toLowerCase().includes(query))
}

/** Owns only the local token filter and renders saved transactions.
 * Polling is mounted by SwapPage independently, so closing History must not stop status updates. */
const HistoryPanel = ({ onBack }: { onBack: () => void }) => {
  const [transactions] = useCrossChainTransactions()
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const filteredTransactions = useMemo(
    () =>
      query
        ? transactions.filter(tx => matchesToken(tx.sourceToken, query) || matchesToken(tx.targetToken, query))
        : transactions,
    [query, transactions],
  )

  return (
    <Stack className="min-w-0 rounded-xl bg-background shadow-[0_8px_24px_rgba(0,0,0,0.10)]">
      <HStack as="header" className="flex-wrap items-center gap-4 px-4 pb-2 pt-3 max-sm:gap-2 max-sm:px-3">
        <HStack className="shrink-0 items-center gap-1">
          <IconButton aria-label={t`Back to chart and route`} onClick={onBack}>
            <ChevronLeft size={26} className="text-subText" aria-hidden />
          </IconButton>
          <span className="text-xl font-medium text-text">{t`History`}</span>
        </HStack>
        <HStack className="h-10 min-w-0 max-w-[400px] flex-1 items-center gap-1 rounded-xl bg-black/20 pl-3 pr-2 transition-shadow duration-150 focus-within:ring-1 focus-within:ring-subText/20 max-sm:max-w-none max-sm:basis-full">
          <Search size={20} className="shrink-0 text-subText" aria-hidden />
          <Input
            aria-label={t`Filter history by token`}
            placeholder={t`Search token or address`}
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-sm text-text placeholder:text-sm placeholder:text-subText"
          />
          {search && (
            <IconButton variant="action" aria-label={t`Clear token filter`} onClick={() => setSearch('')}>
              <X size={20} aria-hidden />
            </IconButton>
          )}
        </HStack>
      </HStack>
      <div className="min-w-0 px-4 pb-4 pt-1 max-sm:px-3 max-sm:pb-3">
        <div className="min-w-0 overflow-x-auto">
          <div className="min-w-[800px] max-sm:min-w-0">
            <TransactionHistoryList
              transactions={filteredTransactions}
              filterKey={query}
              emptyMessage={query && transactions.length ? t`No transactions match this token.` : undefined}
            />
          </div>
        </div>
      </div>
    </Stack>
  )
}

export default HistoryPanel
