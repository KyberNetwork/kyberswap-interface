import { Trans, t } from '@lingui/macro'
import { ReactNode } from 'react'
import { Check } from 'react-feather'

import { ReactComponent as GasLessIcon } from 'assets/svg/gas_less_icon.svg'
import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import { GasStation } from 'components/Icons'
import { CancelStatus } from 'components/LimitOrder/CancelOrder/CancelOrderModal'
import { DOCS_LINKS, getPayloadTracking } from 'components/LimitOrder/helpers'
import { CancelOrderType, LimitOrder } from 'components/LimitOrder/types'
import { HStack, Stack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { ExternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const CancelOptionNote = ({ children, href }: { children: ReactNode; href: string }) => (
  <Stack className="gap-1 text-xs leading-4 text-subText">
    <span>{children}</span>
    <ExternalLink href={href} className="w-fit whitespace-nowrap">
      <Trans>Learn more ↗︎</Trans>
    </ExternalLink>
  </Stack>
)

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
  cancelType: CancelOrderType
  setCancelType: (v: CancelOrderType) => void
  buttonInfo: ButtonInfo
  order: LimitOrder | undefined
}) => {
  const theme = useTheme()
  const isCountDown = cancelStatus === CancelStatus.COUNTDOWN
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
      <HStack className="items-start gap-3 max-sm:flex-col">
        <ButtonLight onClick={onDismiss} height={'44px'} width={'100%'}>
          <Check size={18} /> &nbsp;<Trans>Close</Trans>
        </ButtonLight>
      </HStack>
    )

  const propsGasless = { height: '44px', width: '100%' }
  const propsHardCancel = { style: { height: '44px', width: '100%' }, disabled: disabledHardCancel }
  const onConfirm =
    onSubmit || (cancelType === CancelOrderType.GAS_LESS_CANCEL ? onClickGaslessCancel : onClickHardCancel)

  if (isCountDown)
    return (
      <HStack className="flex-row-reverse items-start gap-3 max-sm:flex-col">
        <Stack className="w-full gap-2">
          <ButtonPrimary {...propsGasless} onClick={onDismiss}>
            <Check size={18} />
            &nbsp;
            <Trans>Close</Trans>
          </ButtonPrimary>
        </Stack>
        <Stack className="w-full gap-2">
          <ButtonOutlined {...propsHardCancel} onClick={onClickHardCancel} color={theme.red}>
            <GasStation size={20} />
            &nbsp;
            <Trans>Hard Cancel Instead</Trans>
          </ButtonOutlined>
          <CancelOptionNote href={DOCS_LINKS.HARD_CANCEL}>
            <Trans>Cancel immediately by paying {gasAmountDisplay} gas fees.</Trans>
          </CancelOptionNote>
        </Stack>
      </HStack>
    )

  return (
    <>
      <HStack className="items-start gap-3 max-sm:flex-col">
        <Stack className="w-full gap-2">
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
          <CancelOptionNote href={DOCS_LINKS.GASLESS_CANCEL}>
            <Trans>Cancel without paying gas. Cancellation may not be instant.</Trans>
          </CancelOptionNote>
        </Stack>
        <Stack className="w-full gap-2">
          <ButtonOutlined
            {...propsHardCancel}
            onClick={() => onSetType(CancelOrderType.HARD_CANCEL)}
            color={cancelType === CancelOrderType.HARD_CANCEL ? theme.primary : undefined}
          >
            <GasStation size={20} />
            &nbsp;
            {hardCancelGasless}
          </ButtonOutlined>
          <CancelOptionNote href={DOCS_LINKS.HARD_CANCEL}>
            <Trans>Cancel immediately by paying {gasAmountDisplay} gas fees.</Trans>
          </CancelOptionNote>
        </Stack>
      </HStack>
      <ButtonPrimary disabled={disabledConfirm} width={'100%'} height={'44px'} onClick={onConfirm}>
        {confirmBtnText}
      </ButtonPrimary>
    </>
  )
}

export default CancelButtons
