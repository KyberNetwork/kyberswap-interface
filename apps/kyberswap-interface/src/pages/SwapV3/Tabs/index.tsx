import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Fragment, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { ButtonEmpty } from 'components/Button'
import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import usePageLocation from 'hooks/usePageLocation'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { TAB } from 'pages/SwapV3'
import LimitTab from 'pages/SwapV3/Tabs/LimitTab'
import { isSupportLimitOrder } from 'utils'
import { cn } from 'utils/cn'

export const Tab = ({
  children,
  className,
  $isActive,
  $isDisabled,
  ...rest
}: React.ComponentProps<typeof ButtonEmpty> & { $isActive: boolean; $isDisabled?: boolean }) => (
  <ButtonEmpty
    className={cn(
      'relative inline-flex w-fit items-center gap-2 rounded-none p-0 text-lg font-medium leading-[normal] hover:no-underline focus:no-underline max-sm:px-1.5 max-sm:py-0 max-sm:text-sm',
      $isDisabled ? 'text-border' : $isActive ? 'text-primary' : 'text-subText hover:text-text',
      className,
    )}
    {...rest}
  >
    {children}
  </ButtonEmpty>
)

const TabDivider = () => <span aria-hidden className="h-6 w-0.5 shrink-0 rounded-sm bg-border" />

type Props = {
  activeTab: TAB
  setActiveTab: (tab: TAB) => void
  customChainId?: ChainId
}
export default function Tabs({ activeTab, setActiveTab, customChainId }: Props) {
  const navigateFn = useNavigate()
  const { networkInfo, chainId: walletChainId } = useActiveWeb3React()
  const { trackingHandler } = useTracking()
  const chainId = customChainId || walletChainId

  const { currency: currencyParam } = useParams()

  const { pathname, isEmbeddedSwap } = usePageLocation()

  const [searchParams] = useSearchParams()
  let features = (searchParams.get('features') || '')
    .split(',')
    .filter(item => [TAB.SWAP, TAB.LIMIT, TAB.CROSS_CHAIN].includes(item))
  if (!features.length) features = [TAB.SWAP, TAB.LIMIT, TAB.CROSS_CHAIN]

  const show = (tab: TAB) => (isEmbeddedSwap ? features.includes(tab) : true)

  const onClickTab = (tab: TAB) => {
    if (activeTab === tab) {
      return
    }
    if (tab === TAB.CROSS_CHAIN) {
      trackingHandler(TRACKING_EVENT_TYPE.CC_TAB_SELECTED, {
        tab_name: tab,
        previous_tab: activeTab,
      })
    }
    if (isEmbeddedSwap) {
      setActiveTab(tab)
      return
    }

    setActiveTab(tab)
    if (tab === TAB.SWAP && pathname.includes('/swap')) {
      return
    }
    navigateFn({
      pathname:
        tab === TAB.CROSS_CHAIN
          ? APP_PATHS.CROSS_CHAIN
          : `${tab === TAB.LIMIT ? APP_PATHS.LIMIT : APP_PATHS.SWAP}/${networkInfo.route}/${currencyParam || ''}`,
    })
  }

  const tabs: { key: TAB; node: ReactNode }[] = []
  if (show(TAB.SWAP)) {
    tabs.push({
      key: TAB.SWAP,
      node: (
        <Tab onClick={() => onClickTab(TAB.SWAP)} $isActive={TAB.SWAP === activeTab}>
          <span className="font-medium">
            <Trans>Swap</Trans>
          </span>
        </Tab>
      ),
    })
  }
  if (show(TAB.LIMIT) && isSupportLimitOrder(chainId)) {
    tabs.push({
      key: TAB.LIMIT,
      node: (
        <LimitTab
          onClick={() => onClickTab(TAB.LIMIT)}
          active={activeTab === TAB.LIMIT}
          customChainId={customChainId}
        />
      ),
    })
  }
  if (show(TAB.CROSS_CHAIN)) {
    tabs.push({
      key: TAB.CROSS_CHAIN,
      node: (
        <Tab
          onClick={() => onClickTab(TAB.CROSS_CHAIN)}
          $isActive={activeTab === TAB.CROSS_CHAIN}
          data-testid="cross-chain-tab"
        >
          <Trans>Cross-Chain</Trans>
        </Tab>
      ),
    })
  }

  return (
    <Stack className="items-start sm:flex-row sm:items-center sm:justify-between">
      <HStack className="items-center gap-2">
        {tabs.map((tab, index) => (
          <Fragment key={tab.key}>
            {index > 0 && <TabDivider />}
            {tab.node}
          </Fragment>
        ))}
      </HStack>
    </Stack>
  )
}
