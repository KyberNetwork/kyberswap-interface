import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { useDeleteSingleAlertMutation, useUpdatePriceAlertMutation } from 'services/priceAlert'

import NotificationIcon from 'components/Icons/NotificationIcon'
import Toggle from 'components/Toggle'
import useTheme from 'hooks/useTheme'
import CommonSingleAlert from 'pages/NotificationCenter/PriceAlerts/CommonSingleAlert'
import DeleteSingleAlertButton from 'pages/NotificationCenter/PriceAlerts/DeleteSingleAlertButton'
import { PriceAlert } from 'pages/NotificationCenter/const'

export const formatCooldown = (t: number) => {
  return dayjs.duration(t, 'seconds').humanize().replace('a ', '1 ').replace('an ', '1 ')
}

type Props = {
  alert: PriceAlert
  isMaxQuotaActiveAlert: boolean
}
const SingleAlert: React.FC<Props> = ({ alert, isMaxQuotaActiveAlert }) => {
  const theme = useTheme()
  const [updateAlert] = useUpdatePriceAlertMutation()
  const [deleteSingleAlert, result] = useDeleteSingleAlertMutation()
  const canUpdateEnable = !(isMaxQuotaActiveAlert && !alert.isEnabled)
  return (
    <CommonSingleAlert
      renderToggle={() => (
        <Toggle
          style={{ transform: 'scale(.8)', cursor: canUpdateEnable ? 'pointer' : 'not-allowed' }}
          icon={<NotificationIcon size={16} color={theme.textReverse} />}
          isActive={alert.isEnabled}
          toggle={() => {
            if (!canUpdateEnable) return
            updateAlert({ id: alert.id, isEnabled: !alert.isEnabled })
          }}
        />
      )}
      renderDeleteButton={() => (
        <DeleteSingleAlertButton onClick={() => deleteSingleAlert(alert.id)} isDisabled={result.isLoading} />
      )}
      timeText={
        <>
          <Trans>Cooldown</Trans>: {formatCooldown(alert.cooldown)}
        </>
      }
      alertData={alert}
    />
  )
}

export default SingleAlert
