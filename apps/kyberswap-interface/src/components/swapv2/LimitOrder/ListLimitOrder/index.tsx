import { ChainId } from '@kyberswap/ks-sdk-core'
import { useSearchParams } from 'react-router-dom'

import TabSelector from 'components/swapv2/LimitOrder/ListLimitOrder/TabSelector'
import ListMyOrder from 'components/swapv2/LimitOrder/ListOrder'
import OrderBook from 'components/swapv2/LimitOrder/OrderBook'
import { LimitOrderTab } from 'components/swapv2/LimitOrder/types'

export default function ListLimitOrder({ customChainId }: { customChainId?: ChainId }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = (searchParams.get('activeTab') as LimitOrderTab) || LimitOrderTab.ORDER_BOOK

  const setActiveTab = (tab: LimitOrderTab) => {
    searchParams.set('activeTab', tab)
    setSearchParams(searchParams, { replace: true })
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-darkBorder max-sm:-ml-4 max-sm:w-screen max-sm:rounded-none max-sm:border-0">
      <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
        <TabSelector setActiveTab={setActiveTab} activeTab={activeTab} />
      </div>

      {activeTab === LimitOrderTab.ORDER_BOOK ? <OrderBook /> : <ListMyOrder customChainId={customChainId} />}
    </div>
  )
}
