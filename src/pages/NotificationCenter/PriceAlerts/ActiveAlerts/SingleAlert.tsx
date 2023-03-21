import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { useDeleteSingleAlertMutation, useUpdatePriceAlertMutation } from 'services/priceAlert'

import NotificationIcon from 'components/Icons/NotificationIcon'
import Toggle from 'components/Toggle'
import useTheme from 'hooks/useTheme'
import CommonSingleAlert from 'pages/NotificationCenter/PriceAlerts/CommonSingleAlert'
import DeleteSingleAlertButton from 'pages/NotificationCenter/PriceAlerts/DeleteSingleAlertButton'
import { PriceAlert } from 'pages/NotificationCenter/const'

const formatCooldown = (t: number) => {
  return dayjs.duration(t, 'seconds').humanize()
}

type Props = {
  alert: PriceAlert
}
const SingleAlert: React.FC<Props> = ({ alert }) => {
  const theme = useTheme()
  const [updateAlert] = useUpdatePriceAlertMutation()
  const [deleteSingleAlert, result] = useDeleteSingleAlertMutation()
  return (
    <CommonSingleAlert
      renderToggle={() => (
        <Toggle
          style={{ transform: 'scale(.8)', cursor: 'pointer' }}
          icon={<NotificationIcon size={16} color={theme.textReverse} />}
          isActive={alert.isEnabled}
          toggle={() => {
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
      {...alert}
    />
  )
}

export default SingleAlert
