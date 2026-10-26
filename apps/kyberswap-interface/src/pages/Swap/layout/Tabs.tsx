import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { ButtonEmpty } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { isSupportLimitOrder } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import usePageLocation from 'hooks/usePageLocation'
import { LimitTab } from 'pages/Swap/layout/LimitTab'
import { useCurrencyFromUrl } from 'state/swap/hooks'
import { cn } from 'utils/cn'
import { isSwapLikePath } from 'utils/routes'
import { getDefaultSwapTokenId, getTradeLocation } from 'utils/swapFlow'

export enum TAB {
  SWAP = 'swap',
  INFO = 'info',
  SETTINGS = 'settings',
  LIQUIDITY_SOURCES = 'liquidity_sources',
  LIMIT = 'limit',
  CROSS_CHAIN = 'cross_chain',
  CROSS_CHAIN_SOURCES = 'cross_chain_sources',
}

export type MainTab = TAB.SWAP | TAB.LIMIT | TAB.CROSS_CHAIN

export const isSettingTab = (tab: TAB) =>
  [TAB.INFO, TAB.SETTINGS, TAB.LIQUIDITY_SOURCES, TAB.CROSS_CHAIN_SOURCES].includes(tab)

export const Tab = ({
  children,
  className,
  $isActive,
  $isDisabled,
  ...rest
}: React.ComponentProps<typeof ButtonEmpty> & { $isActive: boolean; $isDisabled?: boolean }) => (
  <ButtonEmpty
    className={cn(
      'relative inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-none p-0 text-lg font-medium leading-[normal] hover:no-underline focus:no-underline max-sm:text-base sm:gap-2',
      $isDisabled ? 'text-border' : $isActive ? 'text-primary' : 'text-subText hover:text-text',
      className,
    )}
    {...rest}
  >
    {children}
  </ButtonEmpty>
)

const TabDivider = () => <span aria-hidden className="h-5 w-0.5 shrink-0 rounded-sm bg-border sm:h-6" />

type Props = {
  activeTab: TAB
  onTabChange: (tab: TAB) => void
  customChainId?: ChainId
}

export const Tabs = ({ activeTab, onTabChange, customChainId }: Props) => {
  const navigateFn = useNavigate()
  const { networkInfo, chainId: walletChainId } = useActiveWeb3React()
  const { fromCurrency, toCurrency, inputChain, outputChain } = useCurrencyFromUrl()
  const sameChain = typeof inputChain === 'number' && inputChain === outputChain
  const chainId = customChainId || (sameChain ? inputChain : walletChainId)

  const { pathname, isEmbeddedSwap } = usePageLocation()

  const [searchParams] = useSearchParams()
  let features = (searchParams.get('features') || '').split(',').filter(item => [TAB.SWAP, TAB.LIMIT].includes(item))
  if (!features.length) features = [TAB.SWAP, TAB.LIMIT]

  const show = (tab: TAB) => (isEmbeddedSwap ? features.includes(tab) : true)

  const onClickTab = (tab: TAB) => {
    if (activeTab === tab) {
      return
    }
    if (isEmbeddedSwap) {
      onTabChange(tab)
      return
    }

    onTabChange(tab)
    if (
      tab === TAB.SWAP &&
      (isSwapLikePath(pathname) ||
        pathname.startsWith(APP_PATHS.PARTNER_SWAP) ||
        pathname.startsWith(APP_PATHS.USER_SWAP))
    ) {
      return
    }
    const pair = {
      fromChain: inputChain,
      toChain: outputChain,
      tokenIn: fromCurrency || getDefaultSwapTokenId(inputChain),
      tokenOut: toCurrency || getDefaultSwapTokenId(outputChain),
    }
    if (tab === TAB.SWAP) {
      navigateFn(getTradeLocation('swap', pair, searchParams))
    } else if (sameChain) {
      navigateFn(getTradeLocation('limit', pair, searchParams))
    } else {
      navigateFn(`${APP_PATHS.LIMIT}/${networkInfo.route}`)
    }
  }

  const showSwap = show(TAB.SWAP)
  const showLimit = show(TAB.LIMIT) && isSupportLimitOrder(chainId)

  return (
    <Stack className="items-start sm:flex-row sm:items-center sm:justify-between">
      <HStack className="items-center gap-1 sm:gap-2">
        {showSwap && (
          <Tab onClick={() => onClickTab(TAB.SWAP)} $isActive={TAB.SWAP === activeTab}>
            <span className="font-medium">
              <Trans>Swap</Trans>
            </span>
          </Tab>
        )}
        {showSwap && showLimit && <TabDivider />}
        {showLimit && (
          <LimitTab
            onClick={() => onClickTab(TAB.LIMIT)}
            active={activeTab === TAB.LIMIT}
            customChainId={customChainId}
          />
        )}
      </HStack>
    </Stack>
  )
}
