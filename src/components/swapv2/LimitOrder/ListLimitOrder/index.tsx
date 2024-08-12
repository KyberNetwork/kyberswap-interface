import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'

import ListMyOrder from '../ListOrder'
import OrderBook, { INTERVAL_REFETCH_TIME } from '../OrderBook'
import { LimitOrderTab } from '../type'
import RefreshLoading from './RefreshLoading'
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
    border-radius: 0;
    border: none;
  `};
`

export default function ListLimitOrder({ customChainId }: { customChainId?: ChainId }) {
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState<LimitOrderTab>(LimitOrderTab.ORDER_BOOK)
  const [intervalTime, setIntervalTime] = useState<number>(INTERVAL_REFETCH_TIME)

  return (
    <Wrapper>
      <Flex flexDirection={['column', 'row']} justifyContent={'space-between'} alignItems={['flex-start', 'center']}>
        <TabSelector setActiveTab={setActiveTab} activeTab={activeTab} />
        {activeTab === LimitOrderTab.ORDER_BOOK && (
          <Flex alignItems={'center'} marginRight={[0, '16px']} marginTop={'1rem'} marginLeft={['1rem', 0]}>
            <Text fontSize={'14px'} color={theme.subText} marginRight={'4px'}>
              <Trans>Orders refresh in</Trans>
            </Text>{' '}
            <RefreshLoading countdown={intervalTime} maxCount={INTERVAL_REFETCH_TIME} />
          </Flex>
        )}
      </Flex>

      {activeTab === LimitOrderTab.ORDER_BOOK ? (
        <OrderBook intervalTime={intervalTime} setIntervalTime={setIntervalTime} />
      ) : (
        <ListMyOrder customChainId={customChainId} />
      )}
    </Wrapper>
  )
}
