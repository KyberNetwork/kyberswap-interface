import { Trans } from '@lingui/macro'
import React, { ReactNode, useEffect, useState } from 'react'
import { Check } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as GasLessIcon } from 'assets/svg/gas_less_icon.svg'
import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import { GasStation } from 'components/Icons'
import { useGetEncodeLimitOrder } from 'components/swapv2/LimitOrder/ListOrder/useRequestCancelOrder'
import { CancelStatus } from 'components/swapv2/LimitOrder/Modals/CancelOrderModal'
import { LimitOrder } from 'components/swapv2/LimitOrder/type'
import { EMPTY_ARRAY } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'
import useEstimateGasTxs from 'utils/useEstimateGasTxs'

const ButtonWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `}
`

const CancelButtons = ({
  cancelStatus,
  onOkay,
  onClickHardCancel,
  onClickGaslessCancel,
  loading,
  supportCancelGasless,
  isEdit,
  isCancelAll,
  totalOrder,
  disabledGasLessCancel = false,
  disabledHardCancel = false,
  orders = EMPTY_ARRAY,
}: {
  cancelStatus: CancelStatus
  onOkay: () => void
  onClickGaslessCancel: () => void
  onClickHardCancel: () => void
  loading: boolean
  supportCancelGasless: boolean
  isEdit?: boolean // else cancel
  isCancelAll?: boolean
  totalOrder?: ReactNode
  disabledGasLessCancel?: boolean
  disabledHardCancel?: boolean
  orders?: LimitOrder[]
}) => {
  const theme = useTheme()
  const isCountDown = cancelStatus === CancelStatus.COUNTDOWN
  const isTimeout = cancelStatus === CancelStatus.TIMEOUT
  const isCancelDone = cancelStatus === CancelStatus.CANCEL_DONE

  const getEncodeData = useGetEncodeLimitOrder()
  const estimateGas = useEstimateGasTxs()
  const [gasFeeHardCancel, setGasFeeHardCancel] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal
    const fetchEncode = async () => {
      try {
        if (!orders.length) throw new Error()
        const resp = await getEncodeData({ orders, isCancelAll })
        if (signal.aborted) return
        const data = await Promise.all(resp.map(estimateGas))
        if (signal.aborted) return
        const gas = data.reduce((rs, item) => rs + (item.gasInUsd || 0), 0)
        setGasFeeHardCancel(gas + '')
      } catch (error) {
        if (signal.aborted) return
        setGasFeeHardCancel('')
      }
    }

    setTimeout(() => {
      if (signal.aborted) return
      fetchEncode()
    }, 100)

    return () => controller.abort()
  }, [getEncodeData, orders, estimateGas, isCancelAll])

  const gasAmountDisplay = gasFeeHardCancel
    ? `~${formatDisplayNumber(gasFeeHardCancel + '', {
        style: 'currency',
        significantDigits: 4,
      })}`
    : ''

  const renderGroupButtons = () => {
    const props = {
      color: theme.primary,
      disabled: disabledGasLessCancel || (isCountDown ? false : !supportCancelGasless || loading),
      onClick: isCountDown ? onOkay : onClickGaslessCancel,
      height: '40px',
      width: '100%',
      children: (
        <>
          {isCountDown ? <Check size={18} /> : <GasLessIcon />}
          &nbsp;
          {isCountDown ? (
            <Trans>Close</Trans>
          ) : isCancelAll ? (
            totalOrder
          ) : isEdit ? (
            <Trans>Gasless Edit</Trans>
          ) : (
            <Trans>Gasless Cancel</Trans>
          )}
        </>
      ),
    }
    const buttonGasless = React.createElement(isCountDown ? ButtonPrimary : ButtonOutlined, props)
    return (
      <>
        <Column width={'100%'} gap="8px">
          {buttonGasless}
          <Text color={theme.subText} fontSize={'10px'} lineHeight={'14px'}>
            {isEdit ? <Trans>Edit the order without paying gas.</Trans> : <Trans>Cancel without paying gas.</Trans>}
            <Trans>
              <br /> Cancellation may not be instant. <ExternalLink href="/todo">Learn more ↗︎</ExternalLink>
            </Trans>
          </Text>
        </Column>
        <Column width={'100%'} gap="8px">
          <ButtonOutlined
            disabled={loading || disabledHardCancel}
            onClick={onClickHardCancel}
            style={{ height: '40px', width: '100%' }}
            color={isCountDown ? theme.red : undefined}
          >
            <GasStation size={20} />
            &nbsp;
            {isCountDown ? (
              isEdit ? (
                <Trans>Hard Edit Instead</Trans>
              ) : (
                <Trans>Hard Cancel Instead</Trans>
              )
            ) : isCancelAll ? (
              <Trans>Hard Cancel all orders</Trans>
            ) : isEdit ? (
              <Trans>Hard Edit</Trans>
            ) : (
              <Trans>Hard Cancel</Trans>
            )}
          </ButtonOutlined>
          <Text color={theme.subText} fontSize={'10px'} lineHeight={'14px'}>
            {isEdit ? (
              <Trans>Edit immediately by paying {gasAmountDisplay} gas fees. </Trans>
            ) : (
              <Trans>Cancel immediately by paying {gasAmountDisplay} gas fees. </Trans>
            )}{' '}
            <ExternalLink href="/todo">
              <Trans>Learn more ↗︎</Trans>
            </ExternalLink>
          </Text>
        </Column>
      </>
    )
  }

  return (
    <ButtonWrapper
      style={{
        justifyContent: isTimeout ? 'flex-end' : undefined,
        flexDirection: isCountDown ? 'row-reverse' : undefined,
      }}
    >
      {isCancelDone ? (
        <ButtonLight onClick={onOkay} height={'40px'} width={'100%'}>
          <Check size={18} /> &nbsp;<Trans>Close</Trans>
        </ButtonLight>
      ) : isTimeout ? (
        <ButtonLight onClick={onClickGaslessCancel} height={'40px'} width={'100px'}>
          <Trans>Try Again</Trans>
        </ButtonLight>
      ) : (
        renderGroupButtons()
      )}
    </ButtonWrapper>
  )
}

export default CancelButtons
