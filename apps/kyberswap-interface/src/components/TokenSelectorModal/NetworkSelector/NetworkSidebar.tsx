import { Trans, t } from '@lingui/macro'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { Check } from 'react-feather'

import { ReactComponent as PinIcon } from 'assets/svg/ic_pin.svg'
import IconButton from 'components/Button/IconButton'
import ScrollableWithSignal from 'components/ScrollableWithSignal'
import { Stack } from 'components/Stack'
import { NetworkIcon } from 'components/TokenSelectorModal/NetworkSelector/NetworkIcon'
import { SearchInput, SearchWrapper } from 'components/TokenSelectorModal/components'
import type { TokenSelectorChain, TokenSelectorNetwork } from 'components/TokenSelectorModal/types'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { togglePinnedTokenSelectorChain } from 'state/user/actions'
import { cn } from 'utils/cn'

const MotionScrollableWithSignal = motion.create(ScrollableWithSignal)

type Props = {
  showAllNetworks?: boolean
  chains: TokenSelectorNetwork[]
  selectedChainId: TokenSelectorChain
  onChange?: (chainId: TokenSelectorChain) => void
}

export const NetworkSidebar = ({ chains, selectedChainId, onChange, showAllNetworks = true }: Props) => {
  const [query, setQuery] = useState('')
  const prefersReducedMotion = useReducedMotion()
  const dispatch = useAppDispatch()
  const pinnedChains = useAppSelector(state => state.user.pinnedTokenSelectorChains)

  const isPinned = (chainId: TokenSelectorChain) => pinnedChains?.includes(String(chainId)) ?? false

  const search = query.trim().toLowerCase()
  const sortedChains = [...chains].sort((a, b) => {
    const aIndex = pinnedChains?.indexOf(String(a.chainId)) ?? -1
    const bIndex = pinnedChains?.indexOf(String(b.chainId)) ?? -1

    if (aIndex === -1) return bIndex === -1 ? 0 : 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })
  const options = showAllNetworks
    ? [{ chainId: 'all' as const, name: t`All Networks`, icon: '' }, ...sortedChains]
    : sortedChains
  const matchingChains = options.filter(chain => chain.name.toLowerCase().includes(search))

  return (
    <Stack
      as="aside"
      aria-label="Networks"
      className="hidden min-h-0 w-48 shrink-0 gap-2 rounded-xl bg-black/20 p-2 sm:flex"
    >
      <SearchWrapper className="shrink-0">
        <SearchInput
          aria-label="Search network"
          placeholder={t`Search Network`}
          value={query}
          onChange={event => setQuery(event.target.value)}
          autoComplete="off"
          className="bg-white-04 pr-3"
        />
      </SearchWrapper>
      <div className="relative min-h-0 flex-1">
        <MotionScrollableWithSignal
          layoutScroll
          data-open="true"
          showArrow
          className="ks-scrollbar flex h-full flex-col gap-1 overflow-y-auto"
          aria-label="Select network"
        >
          {matchingChains.map(({ chainId, name, icon }) => (
            <motion.div
              key={chainId}
              layout={prefersReducedMotion ? false : 'position'}
              layoutDependency={pinnedChains}
              transition={{ layout: { type: 'spring', stiffness: 400, damping: 40 } }}
              className={cn(
                'group flex h-10 shrink-0 items-center gap-1 rounded-lg pr-3 text-sm text-text',
                chainId === selectedChainId ? 'bg-primary-10' : 'hover:bg-white-04',
              )}
            >
              <button
                type="button"
                aria-pressed={chainId === selectedChainId}
                title={name}
                onClick={() => onChange?.(chainId)}
                className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-lg pl-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
              >
                <NetworkIcon chainId={chainId} icon={icon} />
                <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
                {chainId === selectedChainId && (
                  <Check size={16} className="shrink-0 text-primary" aria-hidden="true" />
                )}
              </button>
              {chainId !== 'all' && (
                <IconButton
                  size={18}
                  aria-label={isPinned(chainId) ? t`Unpin ${name}` : t`Pin ${name}`}
                  aria-pressed={isPinned(chainId)}
                  title={isPinned(chainId) ? t`Unpin network` : t`Pin network`}
                  onClick={() => dispatch(togglePinnedTokenSelectorChain(String(chainId)))}
                  className={cn(
                    'p-0.5 focus-visible:ring-2 focus-visible:ring-primary/40',
                    !isPinned(chainId) && 'hidden group-hover:inline-flex',
                  )}
                >
                  <PinIcon
                    width="14px"
                    height="14px"
                    className={isPinned(chainId) ? 'text-primary' : 'text-subText'}
                    aria-hidden="true"
                  />
                </IconButton>
              )}
            </motion.div>
          ))}
          {matchingChains.length === 0 && (
            <p className="p-3 text-sm text-subText" role="status">
              <Trans>No networks found.</Trans>
            </p>
          )}
        </MotionScrollableWithSignal>
      </div>
    </Stack>
  )
}
