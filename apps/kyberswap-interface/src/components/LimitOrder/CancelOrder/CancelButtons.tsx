import { Trans, t } from '@lingui/macro'
import { CSSProperties, ReactNode } from 'react'
import { Check } from 'react-feather'

import { ReactComponent as GasLessIcon } from 'assets/svg/gas_less_icon.svg'
import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import { GasStation } from 'components/Icons'
import { CancelStatus } from 'components/LimitOrder/CancelOrder/CancelOrderModal'
import { DOCS_LINKS, getPayloadTracking } from 'components/LimitOrder/helpers'
import { CancelOrderType, LimitOrder } from 'components/LimitOrder/types'
import { MouseoverTooltip } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { ExternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const ButtonWrapper = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div className="flex items-start gap-5 max-sm:flex-col" style={style}>
    {children}
  </div>
)

const ButtonGroup = ({
  buttonGasless,
  buttonHardCancel,
  gasAmountDisplay,
  style,
  showGaslessNote = true,
}: {
  buttonGasless: ReactNode
  buttonHardCancel: ReactNode
  gasAmountDisplay: string
  style?: CSSProperties
  showGaslessNote?: boolean
}) => {
  return (
    <ButtonWrapper style={style}>
      <Column className="w-full gap-2">
        {buttonGasless}
        {showGaslessNote && (
          <span className="text-[10px] leading-[14px] text-subText">
            <Trans>Cancel without paying gas.</Trans>
            <Trans>
              <br /> Cancellation may not be instant.{' '}
              <ExternalLink href={DOCS_LINKS.GASLESS_CANCEL}>Learn more ↗︎</ExternalLink>
            </Trans>
          </span>
        )}
      </Column>
      <Column className="w-full gap-2">
        {buttonHardCancel}
        <span className="text-[10px] leading-[14px] text-subText">
          <Trans>Cancel immediately by paying {gasAmountDisplay} gas fees.</Trans>{' '}
          <ExternalLink href={DOCS_LINKS.HARD_CANCEL}>
            <Trans>Learn more ↗︎</Trans>
          </ExternalLink>
        </span>
      </Column>
    </ButtonWrapper>
  )
}

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
  onDismiss?: () => void
  onSubmit?: () => void
  onClickGaslessCancel: () => void
  onClickHardCancel: () => void
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
  const { trackingHandler } = useTracking()
  const { networkInfo } = useActiveWeb3React()

  const onSetType = (type: CancelOrderType) => {
    setCancelType(type)
    if (!order) return
    trackingHandler(TRACKING_EVENT_TYPE.LO_CLICK_CANCEL_TYPE, {
      ...getPayloadTracking(order, networkInfo.name),
      cancel_type: type === CancelOrderType.GAS_LESS_CANCEL ? 'Gasless' : 'Hard',
    })
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
        gasAmountDisplay={gasAmountDisplay}
        buttonGasless={
          <ButtonPrimary {...propsGasless} onClick={onDismiss}>
            <Check size={18} />
            &nbsp;
            <Trans>Close</Trans>
          </ButtonPrimary>
        }
        buttonHardCancel={
          <ButtonOutlined {...propsHardCancel} onClick={onClickHardCancel} color={theme.red}>
            <GasStation size={20} />
            &nbsp;
            <Trans>Hard Cancel Instead</Trans>
          </ButtonOutlined>
        }
      />
    )

  return (
    <>
      {!confirmOnly && (
        <ButtonGroup
          style={{ flexDirection: isCountDown ? 'row-reverse' : undefined }}
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
          buttonHardCancel={
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
