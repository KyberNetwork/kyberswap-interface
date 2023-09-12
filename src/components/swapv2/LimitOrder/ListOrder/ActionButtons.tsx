import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useEffect, useState } from 'react'
import { Edit3, ExternalLink as LinkIcon, Trash } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties, css } from 'styled-components'

import { DropdownArrowIcon } from 'components/ArrowRotate'
import CopyHelper from 'components/Copy'
import WarningIcon from 'components/Icons/WarningIcon'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import useInterval from 'hooks/useInterval'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils'
import { formatRemainTime } from 'utils/time'

import { isActiveStatus } from '../helpers'
import { LimitOrder, LimitOrderStatus } from '../type'

const IconWrap = styled.div<{ color: string; isDisabled?: boolean }>`
  background-color: ${({ color, isDisabled, theme }) =>
    color ? `${rgba(isDisabled ? theme.subText : color, 0.2)}` : 'transparent'};
  ${({ isDisabled }) =>
    isDisabled
      ? css`
          filter: grayscale(1);
          pointer-events: none;
          cursor: not-allowed;
        `
      : css`
          cursor: pointer;
        `};
  border-radius: 24px;
  padding: 7px 8px 5px 8px;
  margin-left: 5px;
  height: 30px;
  width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const CancelStatusButton = ({ expiredAt, style }: { expiredAt: number | undefined; style?: CSSProperties }) => {
  const theme = useTheme()
  const [remain, setRemain] = useState(0)

  useEffect(() => {
    setRemain(expiredAt && expiredAt - Date.now() > 0 ? Math.floor(expiredAt - Date.now() / 1000) : 0)
  }, [expiredAt])

  const countdown = useCallback(() => {
    setRemain(v => v - 1)
  }, [])

  useInterval(countdown, remain > 0 ? 1000 : null)

  if (remain <= 0) return null
  return (
    <MouseoverTooltipDesktopOnly
      text={
        <Text as="span">
          Gaslessly cancelling in{' '}
          <Text as="span" color={theme.red} fontWeight={'500'}>
            {formatRemainTime(remain)}
          </Text>
        </Text>
      }
      placement="top"
      width="fit-content"
    >
      <IconWrap color={theme.warning} style={style}>
        <WarningIcon color={theme.warning} />
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
  onEditOrder,
  isCancelling = false,
}: {
  order: LimitOrder
  expand?: boolean
  onExpand?: () => void
  txHash: string
  isChildren?: boolean
  itemStyle?: CSSProperties
  onCancelOrder?: (order: LimitOrder) => void
  onEditOrder?: (order: LimitOrder) => void
  isCancelling?: boolean
}) => {
  const { networkInfo } = useActiveWeb3React()
  const theme = useTheme()
  const { status, chainId, transactions = [], operatorSignatureExpiredAt } = order
  const isActiveTab = isActiveStatus(status)
  const numberTxs = transactions.length
  const iconExpand =
    ((isActiveTab && numberTxs >= 1) || (!isActiveTab && numberTxs > 1)) && !isChildren ? (
      <IconWrap color={theme.subText} onClick={onExpand} style={itemStyle}>
        <DropdownArrowIcon rotate={!!expand} color={theme.subText} />
      </IconWrap>
    ) : null

  const isDisabledCopy =
    !isChildren && [LimitOrderStatus.CANCELLED, LimitOrderStatus.CANCELLING, LimitOrderStatus.EXPIRED].includes(status)
  const disabledCancel = isCancelling

  return (
    <Flex alignItems={'center'} justifyContent={'flex-end'}>
      {isActiveTab && !isChildren ? (
        <>
          <CancelStatusButton style={itemStyle} expiredAt={operatorSignatureExpiredAt} />
          {numberTxs === 0 && (
            <MouseoverTooltipDesktopOnly text={disabledCancel ? '' : t`Edit`} placement="top" width="fit-content">
              <IconWrap
                color={theme.primary}
                style={itemStyle}
                onClick={() => onEditOrder?.(order)}
                isDisabled={disabledCancel}
              >
                <Edit3 color={disabledCancel ? theme.border : theme.primary} size={15} />
              </IconWrap>
            </MouseoverTooltipDesktopOnly>
          )}
          <MouseoverTooltipDesktopOnly text={disabledCancel ? '' : t`Cancel`} placement="top" width="fit-content">
            <IconWrap
              color={theme.red}
              style={itemStyle}
              isDisabled={disabledCancel}
              onClick={() => onCancelOrder?.(order)}
            >
              <Trash color={disabledCancel ? theme.border : theme.red} size={15} />
            </IconWrap>
          </MouseoverTooltipDesktopOnly>
          {iconExpand}
        </>
      ) : (
        <>
          {(numberTxs <= 1 || isChildren) && (
            <>
              <MouseoverTooltipDesktopOnly text={isDisabledCopy ? '' : t`Copy Txn Hash`} placement="top" width="135px">
                <IconWrap color={isChildren ? '' : theme.subText} isDisabled={isDisabledCopy} style={itemStyle}>
                  <CopyHelper
                    toCopy={txHash}
                    style={{ color: isDisabledCopy ? theme.border : theme.subText, margin: 0 }}
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
                    <LinkIcon size={15} color={isDisabledCopy ? theme.border : theme.primary} />
                  </ExternalLink>
                </IconWrap>
              </MouseoverTooltipDesktopOnly>
            </>
          )}
          {iconExpand && (
            <>
              {!isChildren && <IconWrap color="" />}
              {iconExpand}
            </>
          )}
        </>
      )}
    </Flex>
  )
}
export default ActionButtons
