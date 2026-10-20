import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { Check } from 'react-feather'

import ScrollableWithSignal from 'components/ScrollableWithSignal'
import { Stack } from 'components/Stack'
import { SearchInput, SearchWrapper } from 'components/TokenSelectorModal/components'
import type { TokenSelectorNetwork } from 'components/TokenSelectorModal/types'
import type { Chain } from 'pages/CrossChainSwap/adapters/types'
import { cn } from 'utils/cn'

type Props = {
  chains: TokenSelectorNetwork[]
  selectedChainId: Chain
  onChange?: (chainId: Chain) => void
}

export const NetworkSidebar = ({ chains, selectedChainId, onChange }: Props) => {
  const [query, setQuery] = useState('')
  const search = query.trim().toLowerCase()
  const matchingChains = chains.filter(chain => chain.name.toLowerCase().includes(search))

  return (
    <Stack
      as="aside"
      aria-label={t`Networks`}
      className="hidden min-h-0 w-48 shrink-0 gap-2 rounded-xl bg-black/20 p-2 sm:flex"
    >
      <SearchWrapper className="shrink-0">
        <SearchInput
          aria-label={t`Search network`}
          placeholder={t`Search Network`}
          value={query}
          onChange={event => setQuery(event.target.value)}
          autoComplete="off"
          className="bg-white-04 pr-3"
        />
      </SearchWrapper>
      <div className="relative min-h-0 flex-1">
        <ScrollableWithSignal
          data-open="true"
          showArrow
          className="ks-scrollbar flex h-full flex-col gap-1 overflow-y-auto"
          aria-label={t`Select network`}
        >
          {matchingChains.map(chain => (
            <button
              key={chain.chainId}
              type="button"
              aria-pressed={chain.chainId === selectedChainId}
              title={chain.name}
              onClick={() => onChange?.(chain.chainId)}
              className={cn(
                'flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-left text-sm text-text',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40',
                chain.chainId === selectedChainId ? 'bg-primary-10' : 'hover:bg-white-04',
              )}
            >
              <img src={chain.icon} alt="" className="size-5 shrink-0 rounded" />
              <span className="min-w-0 flex-1 truncate font-medium">{chain.name}</span>
              {chain.chainId === selectedChainId && (
                <Check size={16} className="shrink-0 text-primary" aria-hidden="true" />
              )}
            </button>
          ))}
          {matchingChains.length === 0 && (
            <p className="p-3 text-sm text-subText" role="status">
              <Trans>No networks found.</Trans>
            </p>
          )}
        </ScrollableWithSignal>
      </div>
    </Stack>
  )
}
