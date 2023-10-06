import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
import { Check } from 'react-feather'
import { Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import { ReactComponent as GasLessIcon } from 'assets/svg/gas_less_icon.svg'
import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import { GasStation } from 'components/Icons'
import { CancelStatus } from 'components/swapv2/LimitOrder/Modals/CancelOrderModal'
import { CancelOrderType } from 'components/swapv2/LimitOrder/type'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const ButtonGroup = ({
  isEdit,
  buttonGasless,
  buttonHardEdit,
  gasAmountDisplay,
  style,
}: {
  isEdit?: boolean
  buttonGasless: ReactNode
  buttonHardEdit: ReactNode
  gasAmountDisplay: string
  style?: CSSProperties
}) => {
  const theme = useTheme()
  return (
    <ButtonWrapper style={style}>
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
        {buttonHardEdit}
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
    </ButtonWrapper>
  )
}

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
  onSubmit,
  loading,
  supportCancelGasless,
  isEdit,
  isCancelAll,
  totalOrder,
  disabledGasLessCancel = false,
  disabledHardCancel = false,
  estimateGas,
  confirmOnly = false,
  cancelType,
  setCancelType,
  confirmBtnText,
}: {
  cancelStatus: CancelStatus
  onOkay: () => void
  onSubmit?: () => void
  onClickGaslessCancel: () => void
  onClickHardCancel: () => void
  loading: boolean
  supportCancelGasless: boolean
  isEdit?: boolean // else cancel
  isCancelAll?: boolean
  totalOrder?: ReactNode
  disabledGasLessCancel?: boolean
  disabledHardCancel?: boolean
  estimateGas: string
  confirmOnly?: boolean
  cancelType: CancelOrderType
  setCancelType: (v: CancelOrderType) => void
  confirmBtnText?: ReactNode
}) => {
  const theme = useTheme()
  const isWaiting = cancelStatus === CancelStatus.WAITING
  const isCountDown = cancelStatus === CancelStatus.COUNTDOWN
  const isTimeout = cancelStatus === CancelStatus.TIMEOUT
  const isCancelDone = cancelStatus === CancelStatus.CANCEL_DONE

  const gasAmountDisplay = estimateGas
    ? `~${formatDisplayNumber(estimateGas + '', {
        style: 'currency',
        significantDigits: 4,
      })}`
    : ''

  if (isCancelDone)
    return (
      <ButtonWrapper>
        <ButtonLight onClick={onOkay} height={'40px'} width={'100%'}>
          <Check size={18} /> &nbsp;<Trans>Close</Trans>
        </ButtonLight>
      </ButtonWrapper>
    )

  if (isTimeout)
    return (
      <ButtonWrapper style={{ justifyContent: 'flex-end' }}>
        <ButtonLight onClick={onClickGaslessCancel} height={'40px'} width={'100px'}>
          <Trans>Try Again</Trans>
        </ButtonLight>
      </ButtonWrapper>
    )

  const propsGasless = {
    color: cancelType === CancelOrderType.GAS_LESS_CANCEL ? theme.primary : undefined,
    height: '40px',
    width: '100%',
  }
  const propsHardCancel = { style: { height: '40px', width: '100%' }, disabled: loading || disabledHardCancel }

  if (isCountDown)
    return (
      <ButtonGroup
        style={{ flexDirection: 'row-reverse' }}
        isEdit={isEdit}
        gasAmountDisplay={gasAmountDisplay}
        buttonGasless={
          <ButtonPrimary {...propsGasless} onClick={onOkay}>
            <Check size={18} />
            &nbsp;
            <Trans>Close</Trans>
          </ButtonPrimary>
        }
        buttonHardEdit={
          <ButtonOutlined {...propsHardCancel} onClick={onClickHardCancel} color={theme.red}>
            <GasStation size={20} />
            &nbsp;
            {isEdit ? <Trans>Hard Edit Instead</Trans> : <Trans>Hard Cancel Instead</Trans>}
          </ButtonOutlined>
        }
      />
    )

  return (
    <>
      {!confirmOnly && (
        <ButtonGroup
          style={{ flexDirection: isCountDown ? 'row-reverse' : undefined }}
          isEdit={isEdit}
          gasAmountDisplay={gasAmountDisplay}
          buttonGasless={
            <ButtonOutlined
              {...propsGasless}
              onClick={() => setCancelType(CancelOrderType.GAS_LESS_CANCEL)}
              disabled={disabledGasLessCancel || !supportCancelGasless || loading}
            >
              <GasLessIcon />
              &nbsp;
              {isCancelAll ? totalOrder : isEdit ? <Trans>Gasless Edit</Trans> : <Trans>Gasless Cancel</Trans>}
            </ButtonOutlined>
          }
          buttonHardEdit={
            <ButtonOutlined
              {...propsHardCancel}
              onClick={() => setCancelType(CancelOrderType.HARD_CANCEL)}
              color={cancelType === CancelOrderType.HARD_CANCEL ? theme.primary : undefined}
            >
              <GasStation size={20} />
              &nbsp;
              {isCancelAll ? (
                <Trans>Hard Cancel All Orders</Trans>
              ) : isEdit ? (
                <Trans>Hard Edit</Trans>
              ) : (
                <Trans>Hard Cancel</Trans>
              )}
            </ButtonOutlined>
          }
        />
      )}
      {isWaiting && (
        <ButtonPrimary
          disabled={loading || (disabledGasLessCancel && disabledHardCancel)}
          width={'100%'}
          height={'40px'}
          onClick={
            onSubmit || (cancelType === CancelOrderType.GAS_LESS_CANCEL ? onClickGaslessCancel : onClickHardCancel)
          }
        >
          {confirmBtnText}
        </ButtonPrimary>
      )}
    </>
  )
}

export default CancelButtons
