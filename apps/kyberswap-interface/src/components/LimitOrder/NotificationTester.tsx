import { ChainId } from '@kyberswap/ks-sdk-core'
import { ReactNode, useRef } from 'react'
import { Bell } from 'react-feather'

import { NotificationType, PopupType } from 'components/Announcement/type'
import IconButton from 'components/Button/IconButton'
import { SummaryNotify } from 'components/LimitOrder/MyOrders/SummaryNotify'
import { LimitOrder, LimitOrderStatus } from 'components/LimitOrder/types'
import { APP_PATHS, TIMES_IN_SECS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useAddPopup } from 'state/application/hooks'

type Props = {
  visible?: boolean
}

type MockOrderParams = {
  id: number
  chainId: ChainId
  status: LimitOrderStatus
  isSuccessful?: boolean
}

type TestNotification = {
  title: string
  type: NotificationType
  summary: ReactNode
  link?: string
}

const mockAmounts = [
  {
    makingAmount: '100000000',
    takingAmount: '40000000000000000',
    partialMakingAmount: '50000000',
    partialTakingAmount: '20000000000000000',
    smallMakingAmount: '25000000',
    smallTakingAmount: '10000000000000000',
  },
  {
    makingAmount: '250000000',
    takingAmount: '110000000000000000',
    partialMakingAmount: '125000000',
    partialTakingAmount: '55000000000000000',
    smallMakingAmount: '50000000',
    smallTakingAmount: '22000000000000000',
  },
]

const getFilledAmounts = (status: LimitOrderStatus, index: number) => {
  const amount = mockAmounts[index % mockAmounts.length]

  if (status === LimitOrderStatus.FILLED) {
    return { filledMakingAmount: amount.makingAmount, filledTakingAmount: amount.takingAmount }
  }
  if (status === LimitOrderStatus.PARTIALLY_FILLED) {
    return { filledMakingAmount: amount.partialMakingAmount, filledTakingAmount: amount.partialTakingAmount }
  }
  if (status === LimitOrderStatus.EXPIRED || status === LimitOrderStatus.CANCELLED) {
    return { filledMakingAmount: amount.smallMakingAmount, filledTakingAmount: amount.smallTakingAmount }
  }

  return { filledMakingAmount: '0', filledTakingAmount: '0' }
}

const createMockOrder = ({ id, chainId, status, isSuccessful = true }: MockOrderParams): LimitOrder => {
  const amount = mockAmounts[id % mockAmounts.length]
  const { filledMakingAmount, filledTakingAmount } = getFilledAmounts(status, id)

  return {
    id,
    nonce: id,
    chainId,
    makerAsset: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    takerAsset: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    makerAssetSymbol: 'USDC',
    takerAssetSymbol: 'ETH',
    makerAssetLogoURL: '',
    takerAssetLogoURL: '',
    makerAssetDecimals: 6,
    takerAssetDecimals: 18,
    makingAmount: amount.makingAmount,
    takingAmount: amount.takingAmount,
    filledMakingAmount,
    filledTakingAmount,
    status,
    createdAt: Math.floor(Date.now() / 1000),
    expiredAt: Math.floor(Date.now() / 1000) + TIMES_IN_SECS.ONE_DAY,
    transactions: [],
    contractAddress: '',
    isSuccessful,
    uuid: `test-limit-order-${id}`,
    txHash: '',
  }
}

/**
 * Just for testing purpose, will be hidden in production
 * @param visible
 * @returns
 */
export default function NotificationTester({ visible }: Props) {
  const testPopupCount = useRef(0)
  const { chainId } = useActiveWeb3React()
  const addPopup = useAddPopup()

  if (!visible) return null

  const triggerTestPopup = () => {
    testPopupCount.current += 1
    const count = testPopupCount.current
    const mockChainId = chainId ?? ChainId.MAINNET
    const order = (status: LimitOrderStatus, offset = 0, isSuccessful = true) =>
      createMockOrder({ id: count * 10 + offset, chainId: mockChainId, status, isSuccessful })
    const multiOrders = (status: LimitOrderStatus, isSuccessful = true) =>
      Array.from({ length: 5 + Math.floor(Math.random() * 6) }, (_, index) => order(status, index + 1, isSuccessful))
    const cases: TestNotification[] = [
      {
        title: 'Order Filled',
        type: NotificationType.SUCCESS,
        summary: <SummaryNotify orders={[order(LimitOrderStatus.FILLED)]} type={LimitOrderStatus.FILLED} />,
      },
      {
        title: 'Order Partially Filled',
        type: NotificationType.SUCCESS,
        summary: (
          <SummaryNotify orders={[order(LimitOrderStatus.PARTIALLY_FILLED)]} type={LimitOrderStatus.PARTIALLY_FILLED} />
        ),
      },
      {
        title: 'Order Expired',
        type: NotificationType.WARNING,
        summary: <SummaryNotify orders={[order(LimitOrderStatus.EXPIRED)]} type={LimitOrderStatus.EXPIRED} />,
      },
      {
        title: 'Limit Order',
        type: NotificationType.SUCCESS,
        summary: <SummaryNotify orders={[order(LimitOrderStatus.CANCELLED)]} type={LimitOrderStatus.CANCELLED} />,
        link: APP_PATHS.LIMIT,
      },
      {
        title: 'Order Cancel Failed',
        type: NotificationType.ERROR,
        summary: (
          <SummaryNotify
            orders={[order(LimitOrderStatus.CANCELLED_FAILED, 0, false)]}
            type={LimitOrderStatus.CANCELLED_FAILED}
          />
        ),
      },
      {
        title: 'Order Filled',
        type: NotificationType.SUCCESS,
        summary: <SummaryNotify orders={multiOrders(LimitOrderStatus.FILLED)} type={LimitOrderStatus.FILLED} />,
      },
      {
        title: 'Order Expired',
        type: NotificationType.WARNING,
        summary: <SummaryNotify orders={multiOrders(LimitOrderStatus.EXPIRED)} type={LimitOrderStatus.EXPIRED} />,
      },
      {
        title: 'Limit Order',
        type: NotificationType.SUCCESS,
        summary: <SummaryNotify orders={multiOrders(LimitOrderStatus.CANCELLED)} type={LimitOrderStatus.CANCELLED} />,
        link: APP_PATHS.LIMIT,
      },
      {
        title: 'Order Cancel Failed',
        type: NotificationType.ERROR,
        summary: (
          <SummaryNotify
            orders={multiOrders(LimitOrderStatus.CANCELLED_FAILED, false)}
            type={LimitOrderStatus.CANCELLED_FAILED}
          />
        ),
      },
      {
        title: 'Limit Order',
        type: NotificationType.SUCCESS,
        summary: <SummaryNotify message="You have successfully cancelled all orders." />,
        link: APP_PATHS.LIMIT,
      },
      {
        title: 'Cancel Orders Failed',
        type: NotificationType.ERROR,
        summary: <SummaryNotify message="Cancel all orders failed. Please try again." />,
        link: APP_PATHS.LIMIT,
      },
    ]
    const selectedCase = cases[Math.floor(Math.random() * cases.length)]

    addPopup({
      content: {
        title: selectedCase.title,
        summary: selectedCase.summary,
        type: selectedCase.type,
        link: selectedCase.link,
      },
      popupType: PopupType.SIMPLE,
      key: `test-limit-order-popup-${Date.now()}-${count}`,
    })
  }

  return (
    <IconButton variant="action" onClick={triggerTestPopup}>
      <Bell className="text-subText" size={18} />
    </IconButton>
  )
}
