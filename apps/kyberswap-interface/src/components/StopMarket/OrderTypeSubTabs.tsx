import { Trans } from '@lingui/macro'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMedia } from 'react-use'

import { NewTag } from 'components/Header/styleds'
import InfoHelper from 'components/InfoHelper'
import { HStack, Stack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { isSupportStopMarket } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import usePrefetchOnIntent from 'hooks/usePrefetchOnIntent'
import { cn } from 'utils/cn'
import { getTradeProductPath } from 'utils/routes'

const TABS = [
  {
    path: APP_PATHS.LIMIT,
    key: 'limit',
    label: <Trans>Limit</Trans>,
    subtitle: <Trans>Trade at exactly your price</Trans>,
    tooltip: <Trans>Limit Order: Fills at your exact price, when a taker takes it.</Trans>,
  },
  {
    path: APP_PATHS.STOP_MARKET,
    key: 'stop-market',
    label: <Trans>Stop Market</Trans>,
    subtitle: <Trans>Trade the moment your price is hit</Trans>,
    tooltip: (
      <Trans>
        Stop Market: Automatically triggers a swap via KyberSwap Aggregator when your specified price parameters are
        met, based on third-party price data.
      </Trans>
    ),
  },
] as const

/**
 * Switches the trading card between limit and stop market order. Each order type owns a route, so this
 * navigates rather than toggling local state; the pair stays in the path and the sell amount survives
 * because both forms read it from the shared swap state.
 */
const OrderTypeSubTabs = () => {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { network, currency } = useParams<{ network: string; currency?: string }>()
  const { chainId, networkInfo } = useActiveWeb3React()
  const isMobile = useMedia('(max-width: 768px)')
  const stopMarketIntent = usePrefetchOnIntent(() => {
    void import('components/StopMarket/Form/StopMarketForm').catch(() => undefined)
  })

  const activePath = getTradeProductPath(pathname)
  const activeTab = TABS.find(tab => tab.path === activePath)

  const handleSelectOrderType = (path: (typeof TABS)[number]['path']) => {
    if (path === activePath) return

    // `tab` names a panel of the product being left, so it must not ride along.
    const nextSearch = new URLSearchParams(search)
    nextSearch.delete('tab')

    // The form has its own loading boundary, so the tabs can respond immediately.
    navigate({
      pathname: `${path}/${network || networkInfo.route}${currency ? `/${currency}` : ''}`,
      search: nextSearch.toString(),
    })
  }

  // Offering the tab on a chain without stop market orders would only bounce the user to Swap.
  if (!isSupportStopMarket(chainId)) return null

  return (
    <Stack className="gap-1">
      <HStack className="items-center gap-0 text-xs font-medium tracking-[0.04em]" data-testid="order-type-tabs">
        {TABS.map(({ path, key, label, tooltip }, index) => (
          <MouseoverTooltip key={path} text={tooltip} placement="top-start" width="280px" disableTooltip={isMobile}>
            <button
              type="button"
              data-testid={`order-type-tab-${key}`}
              aria-current={path === activePath ? 'page' : undefined}
              {...(path === APP_PATHS.STOP_MARKET ? stopMarketIntent : {})}
              onClick={() => handleSelectOrderType(path)}
              className={cn(
                // The CSS reset forces text-transform:none on buttons, so uppercase belongs here, not on the row.
                'inline-flex cursor-pointer items-center border-0 bg-transparent py-1 pr-3 uppercase transition-colors hover:text-text',
                index < TABS.length - 1 && 'border-r border-darkBorder',
                index === 0 ? 'pl-0' : 'pl-3',
                path === activePath ? 'text-primary' : 'text-gray',
              )}
            >
              {label}
              {path === APP_PATHS.STOP_MARKET && <NewTag className="font-medium" />}
            </button>
          </MouseoverTooltip>
        ))}
      </HStack>
      {activeTab && (
        <HStack className="items-center gap-1 text-xs text-subText" data-testid="order-type-subtitle">
          <span>{activeTab.subtitle}</span>
          {isMobile && (
            <InfoHelper
              key={activeTab.key}
              text={activeTab.tooltip}
              size={12}
              placement="top-start"
              width="280px"
              margin={false}
              clickOnly
            />
          )}
        </HStack>
      )}
    </Stack>
  )
}

export default OrderTypeSubTabs
