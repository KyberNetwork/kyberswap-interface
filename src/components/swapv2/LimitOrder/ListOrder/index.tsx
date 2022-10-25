import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Info, Trash } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import Checkbox from 'components/CheckBox'
import Pagination from 'components/Pagination'
import SearchInput from 'components/SearchInput'
import Select from 'components/Select'
import SubscribeButton from 'components/SubscribeButton'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

import { getListOrder } from '../helpers'
import { LimitOrder, LimitOrderStatus } from '../type'
import OrderItem, { ItemWrapper } from './OrderItem'

const ListWrapper = styled.div`
  display: flex;
  flex-direction: column;
`
const Header = styled(ItemWrapper)`
  background-color: ${({ theme }) => theme.tableHeader};
  color: ${({ theme }) => theme.subText};
  border-radius: 20px 20px 0px 0px;
  font-size: 12px;
  font-weight: 500;
  padding: 16px 12px;
  border-bottom: none;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    border-radius: 0px;
  `};
`

const TabItem = styled.div<{ isActive?: boolean }>`
  text-align: center;
  height: fit-content;
  padding: 4px 12px;
  font-family: 'Work Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
  user-select: none;
  border-radius: 20px;
  transition: all 150ms;
  ${({ isActive, theme }) =>
    isActive &&
    css`
      font-weight: 500;
      text-align: center;
      color: ${theme.text};
      background: ${theme.buttonGray};
    `}
`
enum Tab {
  ACTIVE,
  HISTORY,
}
type Props = {
  className?: string
  activeTab: Tab
  setActiveTab: (n: Tab) => void
}
const ButtonCancelAll = styled(ButtonEmpty)`
  background-color: ${({ theme }) => rgba(theme.red, 0.2)};
  color: ${({ theme }) => theme.red};
  width: 160px;
  font-size: 14px;
  padding: 8px 10px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
   width: 100%;
   padding: 10px;
  `};
`
const TabSelector: React.FC<Props> = ({ className, activeTab, setActiveTab }) => {
  return (
    <Flex className={className}>
      <TabItem
        isActive={activeTab === Tab.ACTIVE}
        role="button"
        onClick={() => {
          setActiveTab(Tab.ACTIVE)
        }}
      >
        <Trans>Active Orders</Trans>
      </TabItem>
      <TabItem
        isActive={activeTab === Tab.HISTORY}
        role="button"
        onClick={() => {
          setActiveTab(Tab.HISTORY)
        }}
      >
        <Trans>Orders History</Trans>
      </TabItem>
    </Flex>
  )
}

const ActiveOptions = [
  {
    label: t`All Active Orders`,
    value: LimitOrderStatus.ACTIVE,
  },
  {
    label: t`Open Orders`,
    value: LimitOrderStatus.OPEN,
  },
  {
    label: t`Partially Filled Orders`,
    value: LimitOrderStatus.PARTIALLY_FILLED,
  },
]
const ClosedOptions = [
  {
    label: t`All Closed Orders`,
    value: LimitOrderStatus.CLOSED,
  },
  {
    label: t`Filled Orders`,
    value: LimitOrderStatus.FILLED,
  },
  {
    label: t`Cancelled Orders`,
    value: LimitOrderStatus.CANCELLED,
  },
  {
    label: t`Expired Orders`,
    value: LimitOrderStatus.EXPRIED,
  },
]
const PAGE_SIZE = 10
const NoResultWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: ${({ theme }) => theme.subText};
  margin-top: 40px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
   margin-top: 16px;
  `};
`

const TableHeader = () => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  return (
    <Header>
      {!upToSmall ? (
        <>
          <Flex alignItems={'center'} style={{ gap: 10 }}>
            <Checkbox type={'checkbox'} />{' '}
            <Text>
              <Trans>TRADE</Trans>
            </Text>
          </Flex>
          <Text className="rate">
            <Trans>RATE</Trans>
          </Text>
          <Text>
            <Trans>CREATED | EXPIRY</Trans>
          </Text>
          <Text>
            <Trans>STATUS | FILLED %</Trans>
          </Text>
          <Text textAlign={'center'}>
            <Trans>ACTION</Trans>
          </Text>
        </>
      ) : (
        <Text>
          <Trans>TRADE</Trans>
        </Text>
      )}
    </Header>
  )
}

const TableFooterWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction:column-reverse;
  `};
`

export default function ListLimitOrder() {
  const { account, chainId } = useActiveWeb3React()
  const [activeTab, setActiveTab] = useState(Tab.ACTIVE)
  const [curPage, setCurPage] = useState(0)
  const [orderType, setOrderType] = useState<LimitOrderStatus>()
  const [keyword, setKeyword] = useState('')
  const theme = useTheme()
  const onPageChange = (page: number) => {
    setCurPage(page)
  }
  const [orders, setOrders] = useState<LimitOrder[]>([])
  const [totalOrder, setTotalOrder] = useState<number>(0)

  const fetchListOrder = useCallback(
    async (status: LimitOrderStatus, query: string) => {
      try {
        const { orders = [], pagination = { totalItems: 0 } } = await getListOrder({
          chainId,
          maker: account,
          status,
          query,
          page: curPage + 1,
          pageSize: PAGE_SIZE,
        })
        setOrders(orders)
        setTotalOrder(pagination.totalItems ?? 0)
      } catch (error) {}
    },
    [account, chainId, curPage],
  )

  const query = useDebounce(keyword, 500)
  useEffect(() => {
    if (orderType) fetchListOrder(orderType, query)
  }, [orderType, query, fetchListOrder])

  useEffect(() => {
    setOrderType(activeTab === Tab.ACTIVE ? LimitOrderStatus.ACTIVE : LimitOrderStatus.CLOSED)
    setKeyword('')
  }, [activeTab])

  // todo update flow chart create order
  return (
    <>
      <Flex justifyContent={'space-between'} alignItems="center">
        <TabSelector setActiveTab={setActiveTab} activeTab={activeTab} />
        <SubscribeButton
          hasSubscribed={false}
          handleUnSubscribe={() => {
            //
          }}
          isLoading={false}
        />
      </Flex>

      <Flex flexDirection={'column'} style={{ gap: '1rem' }}>
        <Flex style={{ marginTop: '24px', gap: 16 }}>
          <Select
            key={activeTab}
            options={activeTab === Tab.ACTIVE ? ActiveOptions : ClosedOptions}
            onChange={setOrderType}
            style={{
              background: theme.background,
              borderRadius: 40,
              minWidth: 160,
              fontSize: 14,
            }}
          />

          <SearchInput
            style={{ flex: 1 }}
            placeholder={t`Search by token symbol or token address`}
            maxLength={255}
            value={keyword}
            onChange={setKeyword}
          />
        </Flex>
        <div>
          <TableHeader />
          <ListWrapper>
            {orders.map(order => (
              <OrderItem key={order.id} order={order} />
            ))}
          </ListWrapper>
        </div>
        {orders.length === 0 && (
          <NoResultWrapper>
            <Info size={isMobile ? 40 : 48} />
            <Text marginTop={'10px'}>
              <Trans>You don&apos;t have any {activeTab === Tab.ACTIVE ? 'active' : 'history'} orders yet</Trans>
            </Text>
          </NoResultWrapper>
        )}
        {orders.length === 0 && curPage === 1 ? null : (
          <TableFooterWrapper>
            <ButtonCancelAll>
              <Trash size={15} />
              <Text marginLeft={'5px'}>Cancel Selected</Text>
            </ButtonCancelAll>
            <Pagination
              haveBg={false}
              onPageChange={onPageChange}
              totalCount={totalOrder}
              currentPage={curPage + 1}
              pageSize={PAGE_SIZE}
              style={{ padding: '0' }}
            />
          </TableFooterWrapper>
        )}
      </Flex>
    </>
  )
}
