import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, X } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useUpdatePriceAlertMutation } from 'services/priceAlert'

import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import NotificationIcon from 'components/Icons/NotificationIcon'
import { NetworkLogo } from 'components/Logo'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import Toggle from 'components/Toggle'
import { MouseoverTooltip } from 'components/Tooltip'
import { PRICE_ALERT_TOPIC_ID } from 'constants/env'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import useNotification from 'hooks/useNotification'
import {
  ConfirmAlertModalData,
  PROFILE_MANAGE_ROUTES,
  PriceAlertStat,
  PriceAlertType,
} from 'pages/NotificationCenter/const'
import { cn } from 'utils/cn'
import { uint256ToFraction } from 'utils/numbers'
import { formatTimeDuration } from 'utils/time'

const Label: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...rest }) => (
  <span {...rest} className={cn('text-sm text-subText', className)} />
)

const Value: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...rest }) => (
  <span {...rest} className={cn('text-sm font-medium text-text', className)} />
)

export default function ConfirmModal({
  data: { alert, currencyIn, currencyOut },
  priceAlertStat,
  onDismiss,
}: {
  onDismiss: () => void
  priceAlertStat: PriceAlertStat
  data: ConfirmAlertModalData
}) {
  const { maxActiveAlerts, totalActiveAlerts, totalAlerts, maxAlerts } = priceAlertStat
  const isMaxQuota = totalActiveAlerts >= maxActiveAlerts

  const { disableAfterTrigger, chainId, tokenInAmount, threshold, type, cooldown, note, id } = alert

  const showedAnimation = useRef(false)
  useEffect(() => {
    if (!alert.isEnabled && !showedAnimation.current) {
      setTimeout(() => setEnable(false), 2000)
    }
    showedAnimation.current = true
  }, [alert.isEnabled])

  const [isEnabled, setEnable] = useState(true)
  const canUpdateEnable = isEnabled ? true : !isMaxQuota

  const selectChain = Number(chainId) as ChainId
  const [enablePriceAlert] = useUpdatePriceAlertMutation()
  const { subscribeOne } = useNotification()
  const isLoading = useRef(false)
  const toggleEnable = async () => {
    try {
      if (!id || isLoading.current || !canUpdateEnable) return
      isLoading.current = true
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error }: any = await enablePriceAlert({ id, isEnabled: !isEnabled })
      if (!isEnabled) subscribeOne(+PRICE_ALERT_TOPIC_ID)
      if (error) throw error
      setEnable(v => !v)
    } catch (error) {
      console.error('update alert error', error)
    } finally {
      setTimeout(() => {
        isLoading.current = false
      }, 100)
    }
  }

  const navigate = useNavigate()
  const onSave = async () => {
    onDismiss()
    navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PRICE_ALERTS}`)
  }

  return (
    <Modal isOpen={true} onDismiss={onDismiss} minHeight={false} maxWidth={480}>
      <div className="m-0 flex w-full flex-col gap-5 p-6">
        <RowBetween>
          <span className="text-xl font-medium">
            <Trans>Alert Created</Trans>
          </span>
          <X onClick={onDismiss} className="cursor-pointer text-subText" />
        </RowBetween>

        <RowBetween>
          <Label>
            <Trans>
              Alerts Created: {totalAlerts}/{maxAlerts}
            </Trans>
          </Label>
          <div className="flex items-center gap-1.5">
            <Label className={cn(isMaxQuota ? 'text-warning' : 'text-subText')}>
              <Trans>
                Active Alerts: {totalActiveAlerts}/{maxActiveAlerts}
              </Trans>
            </Label>
            <MouseoverTooltip text={!canUpdateEnable ? t`Maximum number of Active Alerts reached` : ''}>
              <Toggle
                style={{ transform: 'scale(.8)', cursor: canUpdateEnable ? 'pointer' : 'not-allowed' }}
                icon={<NotificationIcon size={16} className="text-textReverse" />}
                isActive={isEnabled}
                toggle={toggleEnable}
              />
            </MouseoverTooltip>
          </div>
        </RowBetween>

        <div className="flex flex-col gap-3 rounded-3xl bg-buttonBlack p-4">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-3">
            <Label>
              <Trans>Send me an alert when on </Trans>
            </Label>
            <NetworkLogo chainId={selectChain} style={{ width: 16, height: 16 }} />
            <Value>{NETWORKS_INFO[selectChain].name}</Value>
            <Label>
              <Trans>the price of</Trans>
            </Label>

            <div className="flex gap-1.5">
              <CurrencyLogo currency={currencyIn} size={'16px'} />
              <Value>
                {uint256ToFraction(tokenInAmount, currencyIn.decimals)?.toSignificant(6)} {currencyIn.symbol}
              </Value>
            </div>

            <Label>
              <Trans>to</Trans>
            </Label>

            <CurrencyLogo currency={currencyOut} size={'16px'} />
            <Value>{currencyOut.symbol}</Value>

            <Label>
              <Trans>goes</Trans>
            </Label>

            <Value
              className={cn('flex items-center gap-0.5', type === PriceAlertType.ABOVE ? '!text-primary' : '!text-red')}
            >
              {type === PriceAlertType.ABOVE ? <ArrowUp size={18} /> : <ArrowDown size={18} />} {type}
            </Value>

            <Value>
              {threshold} {currencyOut.symbol}
            </Value>
          </div>

          <RowBetween>
            <Label className="!text-xs">
              <Trans>
                Cooldown: <Value className="!text-xs">{formatTimeDuration(cooldown)}</Value>
              </Trans>
            </Label>
            {note && (
              <Label className="!text-xs">
                <Trans>
                  Note: <Value className="!text-xs">{note}</Value>
                </Trans>
              </Label>
            )}
          </RowBetween>

          {disableAfterTrigger && (
            <span className="text-xs italic text-warning">
              <Trans>This alert will be disabled after its triggered once</Trans>
            </span>
          )}
        </div>

        <ButtonPrimary onClick={onSave} className="!h-9 w-full !rounded-[46px]">
          <Trans>View Price Alerts</Trans>
        </ButtonPrimary>
      </div>
    </Modal>
  )
}
