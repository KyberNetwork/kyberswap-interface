import { Plural, Trans } from '@lingui/macro'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'react-feather'

import { Stack } from 'components/Stack'
import { cn } from 'utils/cn'

type InventoryDiscoveryBannerProps = {
  count: number
  expanded: boolean
  onToggle: () => void
}

/**
 * Entry point to the tokens a wallet holds that are neither whitelisted nor imported.
 *
 * Collapsed by default, and deliberately so: an inventory is unfiltered, and a wallet of any age
 * carries airdropped junk — some of it impersonating real tokens. Announcing a count is enough to make
 * a genuinely held token findable, without putting a wall of unvetted names above the verified list.
 */
// The zero-count case is owned by the caller (`showDiscoveries` gates on a non-empty list), which
// also keeps the mount animation meaningful: this component only ever appears with news to announce.
export const InventoryDiscoveryBanner = ({ count, expanded, onToggle }: InventoryDiscoveryBannerProps) => {
  const prefersReducedMotion = useReducedMotion()

  return (
    // The banner mounts only once the inventory response lands — noticeably after the modal opened —
    // so it eases in instead of shoving the token list down in a single frame.
    <motion.div
      initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        data-testid="inventory-discovery-banner"
        className={cn(
          'mx-2 mt-2 flex w-[calc(100%-16px)] items-center justify-between gap-2 rounded-xl border border-border bg-buttonBlack px-3 py-2',
          'text-left transition-colors hover:border-subText-20 hover:bg-buttonGray',
        )}
      >
        <Stack className="min-w-0 gap-0.5">
          <span className="text-xs font-medium text-text sm:text-sm">
            <Plural value={count} one="# more token in your wallet" other="# more tokens in your wallet" />
          </span>
          <span className="truncate text-xs text-subText">
            <Trans>Not on the verified list — check each one before you trade</Trans>
          </span>
        </Stack>
        <ChevronDown
          size={18}
          className={cn(
            'shrink-0 text-subText transition-transform motion-reduce:transition-none',
            expanded && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>
    </motion.div>
  )
}
