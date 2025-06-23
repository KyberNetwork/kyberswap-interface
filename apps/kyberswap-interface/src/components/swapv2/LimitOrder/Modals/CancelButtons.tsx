import { Trans, t } from '@lingui/macro'
import { ReactNode } from 'react'
import { Check } from 'react-feather'
import { Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import { ReactComponent as GasLessIcon } from 'assets/svg/gas_less_icon.svg'
import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import { GasStation } from 'components/Icons'
import { MouseoverTooltip } from 'components/Tooltip'
import { CancelStatus } from 'components/swapv2/LimitOrder/Modals/CancelOrderModal'
import { DOCS_LINKS } from 'components/swapv2/LimitOrder/const'
import { getPayloadTracking } from 'components/swapv2/LimitOrder/helpers'
import { CancelOrderType, LimitOrder } from 'components/swapv2/LimitOrder/type'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const ButtonGroup = ({
  isEdit,
  buttonGasless,
  buttonHardEdit,
  gasAmountDisplay,
  style,
  showGaslessNote = true,
}: {
  isEdit?: boolean
  buttonGasless: ReactNode
  buttonHardEdit: ReactNode
  gasAmountDisplay: string
  style?: CSSProperties
  showGaslessNote?: boolean
}) => {
  const theme = useTheme()
  return (
    <ButtonWrapper style={style}>
      <Column width={'100%'} gap="8px">
        {buttonGasless}
        {showGaslessNote && (
          <Text color={theme.subText} fontSize={'10px'} lineHeight={'14px'}>
            {isEdit ? <Trans>Edit the order without paying gas.</Trans> : <Trans>Cancel without paying gas.</Trans>}
            <Trans>
              <br /> Cancellation may not be instant.{' '}
              <ExternalLink href={DOCS_LINKS.GASLESS_CANCEL}>Learn more ↗︎</ExternalLink>
            </Trans>
          </Text>
        )}
      </Column>
      <Column width={'100%'} gap="8px">
        {buttonHardEdit}
        <Text color={theme.subText} fontSize={'10px'} lineHeight={'14px'}>
          {isEdit ? (
            <Trans>Edit immediately by paying {gasAmountDisplay} gas fees.</Trans>
          ) : (
            <Trans>Cancel immediately by paying {gasAmountDisplay} gas fees.</Trans>
          )}{' '}
          <ExternalLink href={DOCS_LINKS.HARD_CANCEL}>
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

type ButtonInfo = {
  orderSupportGasless: boolean
  chainSupportGasless: boolean
  disabledGasLessCancel: boolean
  disabledHardCancel: boolean
  cancelGaslessText: ReactNode
  hardCancelGasless: ReactNode
  confirmBtnText: ReactNode
  disabledConfirm: boolean
}

const CancelButtons = ({
  cancelStatus,
  onDismiss,
  onClickHardCancel,
  onClickGaslessCancel,
  onSubmit,
  isEdit,
  estimateGas,
  confirmOnly = false,
  cancelType,
  setCancelType,
  order,
  buttonInfo: {
    orderSupportGasless,
    chainSupportGasless,
    disabledGasLessCancel = false,
    disabledHardCancel = false,
    cancelGaslessText,
    hardCancelGasless,
    disabledConfirm,
    confirmBtnText,
  },
}: {
  cancelStatus: CancelStatus
  onDismiss: () => void
  onSubmit?: () => void
  onClickGaslessCancel: () => void
  onClickHardCancel: () => void
  isEdit?: boolean // else cancel
  estimateGas: string
  confirmOnly?: boolean
  cancelType: CancelOrderType
  setCancelType: (v: CancelOrderType) => void
  buttonInfo: ButtonInfo
  order: LimitOrder | undefined
}) => {
  const theme = useTheme()
  const isWaiting = cancelStatus === CancelStatus.WAITING
  const isCountDown = cancelStatus === CancelStatus.COUNTDOWN
  const isTimeout = cancelStatus === CancelStatus.TIMEOUT
  const isCancelDone = cancelStatus === CancelStatus.CANCEL_DONE
  const { mixpanelHandler } = useMixpanel()
  const { networkInfo } = useActiveWeb3React()

  const onSetType = (type: CancelOrderType) => {
    setCancelType(type)
    if (!order) return
    mixpanelHandler(
      isEdit ? MIXPANEL_TYPE.LO_CLICK_UPDATE_TYPE : MIXPANEL_TYPE.LO_CLICK_CANCEL_TYPE,
      getPayloadTracking(order, networkInfo.name, {
        [isEdit ? 'edit_type' : 'cancel_type']: type === CancelOrderType.GAS_LESS_CANCEL ? 'Gasless' : 'Hard',
      }),
    )
  }

  const gasAmountDisplay = estimateGas
    ? `~${formatDisplayNumber(estimateGas + '', {
        style: 'currency',
        significantDigits: 4,
      })}`
    : ''

  if (isCancelDone)
    return (
      <ButtonWrapper>
        <ButtonLight onClick={onDismiss} height={'40px'} width={'100%'}>
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

  const propsGasless = { height: '40px', width: '100%' }
  const propsHardCancel = { style: { height: '40px', width: '100%' }, disabled: disabledHardCancel }

  if (isCountDown)
    return (
      <ButtonGroup
        showGaslessNote={false}
        style={{ flexDirection: 'row-reverse' }}
        isEdit={isEdit}
        gasAmountDisplay={gasAmountDisplay}
        buttonGasless={
          <ButtonPrimary {...propsGasless} onClick={onDismiss}>
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
            <MouseoverTooltip
              placement="top"
              text={
                !chainSupportGasless
                  ? t`This chain is not supported gasless cancel. It's coming soon.`
                  : !orderSupportGasless
                  ? t`This order is not supported gasless cancel. Because it was created by our old contract`
                  : ''
              }
            >
              <ButtonOutlined
                {...propsGasless}
                color={cancelType === CancelOrderType.GAS_LESS_CANCEL ? theme.primary : undefined}
                onClick={() => onSetType(CancelOrderType.GAS_LESS_CANCEL)}
                $disabled={disabledGasLessCancel}
                disabled={disabledGasLessCancel}
              >
                <GasLessIcon />
                &nbsp;
                {cancelGaslessText}
              </ButtonOutlined>
            </MouseoverTooltip>
          }
          buttonHardEdit={
            <ButtonOutlined
              {...propsHardCancel}
              onClick={() => onSetType(CancelOrderType.HARD_CANCEL)}
              color={cancelType === CancelOrderType.HARD_CANCEL ? theme.primary : undefined}
            >
              <GasStation size={20} />
              &nbsp;
              {hardCancelGasless}
            </ButtonOutlined>
          }
        />
      )}
      {isWaiting && (
        <ButtonPrimary
          disabled={disabledConfirm}
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
