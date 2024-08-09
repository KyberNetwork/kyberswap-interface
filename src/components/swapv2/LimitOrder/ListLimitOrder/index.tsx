import { ChainId } from '@kyberswap/ks-sdk-core'
import { useState } from 'react'
import styled from 'styled-components'

import ListMyOrder from '../ListOrder'
import OrderBook from '../OrderBook'
import { LimitOrderTab } from '../type'
import TabSelector from './TabSelector'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.border};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-left: -16px;
    width: 100vw;
    border-left: none;
    border-right: none;
  `};
`

export default function ListLimitOrder({ customChainId }: { customChainId?: ChainId }) {
  const [activeTab, setActiveTab] = useState<LimitOrderTab>(LimitOrderTab.ORDER_BOOK)

  return (
    <Wrapper>
      <TabSelector setActiveTab={setActiveTab} activeTab={activeTab} />

      {activeTab === LimitOrderTab.ORDER_BOOK ? <OrderBook /> : <ListMyOrder customChainId={customChainId} />}
    </Wrapper>
  )
}
