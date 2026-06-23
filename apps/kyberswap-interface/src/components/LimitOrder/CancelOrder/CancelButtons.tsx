import { Trans, t } from '@lingui/macro'
import { KeyboardEvent, ReactNode } from 'react'
import { Check } from 'react-feather'

import { ReactComponent as GasLessIcon } from 'assets/svg/gas_less_icon.svg'
import { ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import { GasStation } from 'components/Icons'
import RadioButtonChecked from 'components/Icons/RadioButtonChecked'
import RadioButtonUnchecked from 'components/Icons/RadioButtonUnchecked'
import { CancelStatus } from 'components/LimitOrder/CancelOrder/types'
import { DOCS_LINKS, getPayloadTracking } from 'components/LimitOrder/helpers'
import { CancelOrderType, LimitOrder } from 'components/LimitOrder/types'
import { HStack, Stack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const CancelOptionNote = ({ children, href }: { children: ReactNode; href: string }) => (
  <Stack className="gap-1 text-xs leading-4 text-subText">
    <span>{children}</span>
    <ExternalLink href={href} className="w-fit whitespace-nowrap">
      <Trans>Learn more ↗︎</Trans>
    </ExternalLink>
  </Stack>
)

const CancelOptionCard = ({
  selected,
  disabled,
  icon,
  title,
  children,
  onSelect,
}: {
  selected: boolean
  disabled?: boolean
  icon: ReactNode
  title: ReactNode
  children: ReactNode
  onSelect: () => void
}) => {
  const handleSelect = () => {
    if (disabled) return
    onSelect()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || (event.key !== 'Enter' && event.key !== ' ')) return

    event.preventDefault()
    handleSelect()
  }

  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        'flex gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
        selected
          ? 'border-primary-50 bg-primary-20 shadow-[0_0_0_1px_rgba(49,203,158,0.12)]'
          : 'border-darkBorder bg-white-04',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-border-primary hover:bg-buttonGray',
      )}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      <span className={cn('mt-0.5 shrink-0', selected ? 'text-primary' : 'text-subText')}>
        {selected ? <RadioButtonChecked size={18} className="text-primary" /> : <RadioButtonUnchecked size={18} />}
      </span>
      <Stack className="min-w-0 gap-2">
        <HStack className="min-w-0 items-center gap-2 text-sm font-medium text-text">
          <span className="shrink-0">{icon}</span>
          <span className="min-w-0 truncate">{title}</span>
        </HStack>
        {children}
      </Stack>
    </div>
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
      ...getPayloadTracking(order, NETWORKS_INFO[order.chainId]?.name || networkInfo.name),
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
      <Stack className="gap-3" role="radiogroup" aria-label={t`Cancel type`}>
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
          <CancelOptionCard
            selected={cancelType === CancelOrderType.GAS_LESS_CANCEL}
            disabled={disabledGasLessCancel}
            icon={<GasLessIcon />}
            title={cancelGaslessText}
            onSelect={() => onSetType(CancelOrderType.GAS_LESS_CANCEL)}
          >
            <CancelOptionNote href={DOCS_LINKS.GASLESS_CANCEL}>
              <Trans>Cancel without paying gas. Cancellation may not be instant.</Trans>
            </CancelOptionNote>
          </CancelOptionCard>
        </MouseoverTooltip>

        <CancelOptionCard
          selected={cancelType === CancelOrderType.HARD_CANCEL}
          disabled={disabledHardCancel}
          icon={<GasStation size={20} />}
          title={hardCancelGasless}
          onSelect={() => onSetType(CancelOrderType.HARD_CANCEL)}
        >
          <CancelOptionNote href={DOCS_LINKS.HARD_CANCEL}>
            <Trans>Cancel immediately by paying {gasAmountDisplay} gas fees.</Trans>
          </CancelOptionNote>
        </CancelOptionCard>
      </Stack>
      <ButtonPrimary disabled={disabledConfirm} width={'100%'} height={'44px'} onClick={onConfirm}>
        {confirmBtnText}
      </ButtonPrimary>
    </>
  )
}

export default CancelButtons
