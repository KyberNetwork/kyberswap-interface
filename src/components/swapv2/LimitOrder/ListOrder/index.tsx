import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
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
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

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
const FilterOptions = [
  {
    label: t`Orders History`,
  },
  {
    label: t`All Closed Orders`,
  },
  {
    label: t`Filled Orders`,
  },
  {
    label: t`Cancelled Orders`,
  },
  {
    label: t`Expired Orders`,
  },
]
export default function ListLimitOrder() {
  const [activeTab, setActiveTab] = useState(Tab.ACTIVE)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const [curPage, setCurPage] = useState(0)
  const [orderType, setOrderType] = useState('')
  const [keyword, setKeyword] = useState('')
  const theme = useTheme()
  const onPageChange = (page: number) => {
    setCurPage(page)
  }
  const orders = new Array(10).fill(123)
  return (
    <>
      <Flex justifyContent={'space-between'}>
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
            options={FilterOptions}
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
          <Header>
            {!upToSmall ? (
              <>
                <Flex alignItems={'center'} style={{ gap: 10 }}>
                  <Checkbox type={'checkbox'} />{' '}
                  <Text>
                    <Trans>TRADE</Trans>
                  </Text>
                </Flex>
                <Text>
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
          <ListWrapper>
            {orders.map((order, index) => (
              <OrderItem key={index} />
            ))}
          </ListWrapper>
        </div>
        {orders.length ? (
          <Flex justifyContent={'space-between'}>
            <ButtonCancelAll>
              <Trash size={15} />
              <Text marginLeft={'5px'}>Cancel Selected</Text>
            </ButtonCancelAll>
            <Pagination
              haveBg={false}
              onPageChange={onPageChange}
              totalCount={1000}
              currentPage={curPage + 1}
              pageSize={10}
              style={{ padding: '0' }}
            />
          </Flex>
        ) : (
          <Flex flexDirection={'column'} alignItems="center" marginTop={50} color={theme.subText}>
            <Info size={48} />
            <Text marginTop={'10px'}>
              <Trans>You don&apos;t have any open orders yet</Trans>
            </Text>
          </Flex>
        )}
      </Flex>
    </>
  )
}
