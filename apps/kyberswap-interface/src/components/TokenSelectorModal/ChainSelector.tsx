import { ChainId } from '@kyberswap/ks-sdk-core'
import { KeyboardEvent, memo, useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Globe } from 'react-feather'

import { ScrollIndicator } from 'components/DropdownMenu/styles'
import type { NetworkInfo } from 'constants/networks/type'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { cn } from 'utils/cn'

type ChainSelectorProps = {
  chains: NetworkInfo[]
  selectedChainId: ChainId
  onChange: (chainId: ChainId) => void
}

export const ChainSelector = memo(({ chains, selectedChainId, onChange }: ChainSelectorProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  // The whole selector modal lives inside a reach-portal, so keep portal clicks in scope: a click
  // inside the modal but outside this dropdown must still close it.
  useOnClickOutside(ref, () => setOpen(false), { ignoreReachPortal: false })

  const selectedChain = chains.find(chain => chain.chainId === selectedChainId)

  const select = (chainId: ChainId) => {
    onChange(chainId)
    setOpen(false)
  }

  // Chevrons signal (and scroll to) the chains hidden above/below the list's max height.
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const updateScrollIndicators = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollUp(el.scrollTop > 0)
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1)
  }, [])

  useEffect(() => {
    if (open) requestAnimationFrame(updateScrollIndicators)
  }, [open, chains, updateScrollIndicators])

  const handleScrollClick = (direction: 'up' | 'down') => {
    scrollRef.current?.scrollBy({ top: direction === 'up' ? -100 : 100, behavior: 'smooth' })
  }

  return (
    <div
      ref={ref}
      className="relative shrink-0"
      onKeyDown={(e: KeyboardEvent) => {
        // Escape closes only the open dropdown — stop it from bubbling up and closing the whole modal.
        if (e.key === 'Escape' && open) {
          e.stopPropagation()
          setOpen(false)
        }
      }}
    >
      <button
        type="button"
        data-testid="token-selector-chain-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select network"
        onClick={() => setOpen(prev => !prev)}
        className="flex h-10 items-center gap-1 rounded-xl bg-black/20 pl-3 pr-2 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {selectedChain ? (
          <img src={selectedChain.icon} alt={selectedChain.name} className="size-5 rounded-full" />
        ) : (
          <Globe size={20} className="text-subText" />
        )}
        <ChevronDown size={20} className={cn('text-subText transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          data-testid="chain-selector-dropdown"
          className="absolute right-0 top-[calc(100%+4px)] z-30 flex w-max origin-top-right animate-dropdownIn flex-col rounded-xl bg-tableHeader px-3 py-2 shadow-[0px_4px_12px_rgba(0,0,0,0.32)] motion-reduce:animate-none"
        >
          <ScrollIndicator $visible={canScrollUp} data-testid="chain-scroll-up" onClick={() => handleScrollClick('up')}>
            <ChevronUp size={16} />
          </ScrollIndicator>

          <div
            ref={scrollRef}
            role="listbox"
            aria-label="Network"
            onScroll={updateScrollIndicators}
            className="ks-scrollbar flex max-h-80 flex-col overflow-y-auto"
          >
            {chains.map(chain => {
              const selected = chain.chainId === selectedChainId
              return (
                <div
                  key={chain.chainId}
                  role="option"
                  aria-selected={selected}
                  data-testid={`chain-option-${chain.chainId}`}
                  tabIndex={0}
                  onClick={() => select(chain.chainId)}
                  onKeyDown={(e: KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      select(chain.chainId)
                    }
                  }}
                  className={cn(
                    'flex h-9 w-full shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-2 text-sm text-text',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                    selected ? 'bg-white-04' : 'hover:bg-white-04',
                  )}
                >
                  <img src={chain.icon} alt={chain.name} className="size-[18px] shrink-0 rounded-full" />
                  <span className="truncate">{chain.name}</span>
                </div>
              )
            })}
          </div>

          <ScrollIndicator
            $visible={canScrollDown}
            data-testid="chain-scroll-down"
            onClick={() => handleScrollClick('down')}
          >
            <ChevronDown size={16} />
          </ScrollIndicator>
        </div>
      )}
    </div>
  )
})
ChainSelector.displayName = 'ChainSelector'
