import { t } from '@lingui/macro'
import { CSSProperties, useCallback, useEffect, useState } from 'react'
import { ExternalLink as LinkIcon, Trash } from 'react-feather'

import { DropdownArrowIcon } from 'components/ArrowRotate'
import CopyHelper from 'components/Copy'
import WarningIcon from 'components/Icons/WarningIcon'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { isActiveStatus } from 'components/swapv2/LimitOrder/helpers'
import { LimitOrder, LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { useActiveWeb3React } from 'hooks'
import useInterval from 'hooks/useInterval'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils'
import { formatRemainTime } from 'utils/time'

const IconWrap = ({
  children,
  color,
  isDisabled,
  style,
  onClick,
}: {
  children: React.ReactNode
  color: string
  isDisabled?: boolean
  style?: CSSProperties
  onClick?: (e: React.MouseEvent) => void
}) => (
  <div
    onClick={isDisabled ? undefined : onClick}
    style={{
      ...style,
      // Theme colors are 6-digit hex — append `33` (= 0x33/255 ≈ 0.2 alpha) for the tinted bg.
      // Avoids color-mix() which the project's browserslist (Chrome 52+) doesn't support.
      backgroundColor: color
        ? `${isDisabled ? '#a9a9a9' : color}${color.startsWith('#') && color.length === 7 ? '33' : ''}`
        : 'transparent',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      filter: isDisabled ? 'grayscale(1)' : undefined,
      pointerEvents: isDisabled ? 'none' : undefined,
    }}
    className="ml-1.5 flex h-[30px] w-[30px] items-center justify-center rounded-3xl px-2 pb-[5px] pt-[7px]"
  >
    {children}
  </div>
)

const CancelStatusButton = ({ expiredAt, style }: { expiredAt: number | undefined; style?: CSSProperties }) => {
  const theme = useTheme()
  const [remain, setRemain] = useState(0)

  useEffect(() => {
    const delta = Math.floor((expiredAt || 0) - Date.now() / 1000)
    setRemain(Math.max(0, delta))
  }, [expiredAt])

  const countdown = useCallback(() => {
    setRemain(v => v - 1)
  }, [])

  useInterval(countdown, remain > 0 ? 1000 : null)

  if (remain <= 0) return null
  return (
    <MouseoverTooltipDesktopOnly
      text={
        <span>
          Gaslessly cancelling in <span className="font-medium text-red">{formatRemainTime(remain)}</span>
        </span>
      }
      placement="top"
      width="fit-content"
    >
      <IconWrap color={theme.warning} style={{ ...style, cursor: 'unset' }}>
        <WarningIcon className="text-warning" />
      </IconWrap>
    </MouseoverTooltipDesktopOnly>
  )
}

const ActionButtons = ({
  order,
  expand,
  onExpand,
  txHash,
  isChildren,
  itemStyle = {},
  onCancelOrder,
  isCancelling = false,
}: {
  order: LimitOrder
  expand?: boolean
  onExpand?: () => void
  txHash: string
  isChildren?: boolean
  itemStyle?: CSSProperties
  onCancelOrder?: (order: LimitOrder) => void
  isCancelling?: boolean
}) => {
  const { networkInfo } = useActiveWeb3React()
  const theme = useTheme()
  const { status, chainId, transactions = [], operatorSignatureExpiredAt } = order
  const isActiveTab = isActiveStatus(status)
  const numberTxs = transactions.length

  const iconExpand =
    ((isActiveTab && numberTxs >= 1) || (!isActiveTab && numberTxs > 1)) && !isChildren ? (
      <IconWrap
        color={theme.subText}
        onClick={e => {
          e.stopPropagation()
          onExpand?.()
        }}
        style={itemStyle}
      >
        <DropdownArrowIcon rotate={!!expand} className="text-subText" />
      </IconWrap>
    ) : null

  const iconCancelling =
    !isChildren && status === LimitOrderStatus.CANCELLING ? (
      <CancelStatusButton style={itemStyle} expiredAt={operatorSignatureExpiredAt} />
    ) : null

  const isDisabledCopy =
    !isChildren && [LimitOrderStatus.CANCELLED, LimitOrderStatus.CANCELLING, LimitOrderStatus.EXPIRED].includes(status)
  const disabledCancel = isCancelling

  return (
    <div className="flex items-center justify-end">
      {iconCancelling}
      {isActiveTab && !isChildren ? (
        <MouseoverTooltipDesktopOnly text={disabledCancel ? '' : t`Cancel`} placement="top" width="fit-content">
          <IconWrap
            color={theme.red}
            style={itemStyle}
            isDisabled={disabledCancel}
            onClick={e => {
              e.stopPropagation()
              onCancelOrder?.(order)
            }}
          >
            <Trash color={disabledCancel ? theme.border : theme.red} size={15} />
          </IconWrap>
        </MouseoverTooltipDesktopOnly>
      ) : (
        (numberTxs <= 1 || isChildren) && (
          <>
            <MouseoverTooltipDesktopOnly text={isDisabledCopy ? '' : t`Copy Txn Hash`} placement="top" width="135px">
              <IconWrap color={isChildren ? '' : theme.subText} isDisabled={isDisabledCopy} style={itemStyle}>
                <CopyHelper
                  toCopy={txHash}
                  style={{ color: isDisabledCopy ? 'var(--ks-subText-40)' : theme.subText, margin: 0 }}
                  size="15"
                />
              </IconWrap>
            </MouseoverTooltipDesktopOnly>
            <MouseoverTooltipDesktopOnly
              text={!isDisabledCopy ? networkInfo.etherscanName : ''}
              placement="top"
              width="fit-content"
            >
              <IconWrap color={isChildren ? '' : theme.primary} isDisabled={isDisabledCopy} style={itemStyle}>
                <ExternalLink href={chainId ? getEtherscanLink(chainId, txHash, 'transaction') : ''}>
                  <LinkIcon size={15} color={isDisabledCopy ? 'var(--ks-subText-40)' : theme.primary} />
                </ExternalLink>
              </IconWrap>
            </MouseoverTooltipDesktopOnly>
          </>
        )
      )}
      {iconExpand}
    </div>
  )
}
export default ActionButtons
