import { Trans, t } from '@lingui/macro'
import { useGetNumberOfInsufficientFundOrdersQuery } from 'services/limitOrder'

import TabButton from 'components/TabButton'
import { MouseoverTooltip } from 'components/Tooltip'
import { LimitOrderTab } from 'components/swapv2/LimitOrder/types'
import { useActiveWeb3React } from 'hooks'

const TAB_BUTTON_CLASS = 'h-fit w-fit !flex-none px-4 py-3 text-sm font-medium max-sm:w-1/2'

const TabSelector = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: LimitOrderTab
  setActiveTab: (n: LimitOrderTab) => void
}) => {
  const { chainId, account } = useActiveWeb3React()
  const { data: numberOfInsufficientFundOrders } = useGetNumberOfInsufficientFundOrdersQuery(
    { chainId, maker: account || '' },
    { skip: !account, pollingInterval: 10_000 },
  )

  return (
    <div className="flex w-fit items-center overflow-hidden max-sm:w-full">
      <TabButton
        className={TAB_BUTTON_CLASS}
        active={activeTab === LimitOrderTab.ORDER_BOOK}
        onClick={() => setActiveTab(LimitOrderTab.ORDER_BOOK)}
        text={t`Open Limit Orders`}
      />
      <TabButton
        className={TAB_BUTTON_CLASS}
        active={activeTab === LimitOrderTab.MY_ORDER}
        text={
          <>
            <Trans>My Order(s)</Trans>
            {!!numberOfInsufficientFundOrders && (
              <MouseoverTooltip
                placement="top"
                text={
                  <Trans>
                    You have {numberOfInsufficientFundOrders} active orders that don&apos;t have sufficient funds.
                  </Trans>
                }
              >
                <span className="ml-2 inline-block min-w-[20px] rounded-[20px] bg-warning-30 px-1.5 py-0.5 text-sm font-medium text-warning">
                  {numberOfInsufficientFundOrders}
                </span>
              </MouseoverTooltip>
            )}
          </>
        }
        onClick={() => setActiveTab(LimitOrderTab.MY_ORDER)}
      />
    </div>
  )
}

export default TabSelector
