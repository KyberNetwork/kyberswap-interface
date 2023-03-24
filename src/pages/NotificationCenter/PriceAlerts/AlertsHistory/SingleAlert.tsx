import dayjs from 'dayjs'
import { useClearSinglePriceAlertHistoryMutation } from 'services/priceAlert'

import { useActiveWeb3React } from 'hooks'
import CommonSingleAlert from 'pages/NotificationCenter/PriceAlerts/CommonSingleAlert'
import DeleteSingleAlertButton from 'pages/NotificationCenter/PriceAlerts/DeleteSingleAlertButton'
import { HistoricalPriceAlert } from 'pages/NotificationCenter/const'

type Props = {
  historicalAlert: HistoricalPriceAlert
}
const SingleAlert: React.FC<Props> = ({ historicalAlert }) => {
  const { account } = useActiveWeb3React()
  const [clearAlert, result] = useClearSinglePriceAlertHistoryMutation()

  return (
    <CommonSingleAlert
      renderDeleteButton={() => (
        <DeleteSingleAlertButton
          isDisabled={result.isLoading}
          onClick={() => account && clearAlert({ account, id: historicalAlert.id })}
        />
      )}
      timeText={dayjs(historicalAlert.sentAt * 1000).format('DD/MM/YYYY hh:mm:ss')}
      alertData={historicalAlert}
      isHistorical
    />
  )
}

export default SingleAlert
