import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { ButtonEmpty } from 'components/Button'
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
      'relative mb-1 mr-1.5 w-fit rounded-none p-0 text-lg font-medium leading-[normal] hover:no-underline focus:no-underline max-sm:px-1.5 max-sm:py-0 max-sm:text-sm',
      "before:mr-2 before:h-[22px] before:w-0.5 before:rounded-sm before:bg-border before:content-['']",
      'first:before:hidden',
      $isDisabled ? 'text-border' : $isActive ? 'text-primary' : 'text-subText',
      className,
    )}
    {...rest}
  >
    {children}
  </ButtonEmpty>
)

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

  const { pathname, isPartnerSwap, isUserSwap } = usePageLocation()
  const isEmbeddedSwap = isPartnerSwap || isUserSwap

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

  return (
    <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center justify-between sm:mb-0">
        {show(TAB.SWAP) && (
          <Tab onClick={() => onClickTab(TAB.SWAP)} $isActive={TAB.SWAP === activeTab}>
            <span className="font-medium">
              <Trans>Swap</Trans>
            </span>
          </Tab>
        )}
        {show(TAB.LIMIT) && isSupportLimitOrder(chainId) && (
          <LimitTab
            onClick={() => onClickTab(TAB.LIMIT)}
            active={activeTab === TAB.LIMIT}
            customChainId={customChainId}
          />
        )}
        {show(TAB.CROSS_CHAIN) && (
          <Tab
            onClick={() => onClickTab(TAB.CROSS_CHAIN)}
            $isActive={activeTab === TAB.CROSS_CHAIN}
            data-testid="cross-chain-tab"
          >
            <Trans>Cross-Chain</Trans>
          </Tab>
        )}
      </div>
    </div>
  )
}
