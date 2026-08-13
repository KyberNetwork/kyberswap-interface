import { Trans } from '@lingui/macro'
import { startTransition } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { HStack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { isSupportStopLoss } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { cn } from 'utils/cn'
import { getTradeProductPath } from 'utils/routes'

const TABS = [
  { path: APP_PATHS.LIMIT, key: 'limit', label: <Trans>Limit Orders</Trans> },
  { path: APP_PATHS.STOP_LOSS, key: 'stop-loss', label: <Trans>Stop Loss</Trans> },
] as const

/**
 * Switches the trading card between limit and stop-loss. Each order type owns a route, so this
 * navigates rather than toggling local state; the pair stays in the path and the sell amount survives
 * because both forms read it from the shared swap state.
 */
const OrderTypeSubTabs = () => {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { network, currency } = useParams<{ network: string; currency?: string }>()
  const { chainId, networkInfo } = useActiveWeb3React()

  // Offering the tab on a chain without stop-loss would only bounce the user to Swap.
  if (!isSupportStopLoss(chainId)) return null

  const activePath = getTradeProductPath(pathname)

  return (
    <HStack className="items-center gap-0 text-xs font-medium tracking-[0.04em]" data-testid="order-type-tabs">
      {TABS.map(({ path, key, label }, index) => (
        <button
          key={path}
          type="button"
          data-testid={`order-type-tab-${key}`}
          aria-current={path === activePath ? 'page' : undefined}
          onClick={() => {
            // `tab` names a panel of the product being left, so it must not ride along.
            const nextSearch = new URLSearchParams(search)
            nextSearch.delete('tab')
            // The destination page is code-split, and the app's only Suspense boundary wraps the whole
            // body — so without a transition React swaps the entire page for the route skeleton while
            // the chunk loads. A transition keeps the current card on screen until the next one is ready.
            startTransition(() => {
              navigate({
                pathname: `${path}/${network || networkInfo.route}${currency ? `/${currency}` : ''}`,
                search: nextSearch.toString(),
              })
            })
          }}
          className={cn(
            // The CSS reset forces text-transform:none on buttons, so uppercase belongs here, not on the row.
            'cursor-pointer border-0 bg-transparent px-3 py-1 uppercase first:pl-0 hover:text-text',
            index < TABS.length - 1 && 'border-r border-darkBorder',
            path === activePath ? 'text-primary' : 'text-subText',
          )}
        >
          {label}
        </button>
      ))}
    </HStack>
  )
}

export default OrderTypeSubTabs
