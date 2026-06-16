import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { ChevronLeft } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { useGetAlertStatsQuery } from 'services/priceAlert'

import { APP_PATHS } from 'constants/index'
import ConfirmModal from 'pages/NotificationCenter/CreateAlert/ConfirmModal'
import CreateAlertForm from 'pages/NotificationCenter/CreateAlert/CreateAlertForm'
import { ConfirmAlertModalData, PROFILE_MANAGE_ROUTES, PriceAlertStat } from 'pages/NotificationCenter/const'

export default function CreateAlert() {
  const [modalData, setModalData] = useState<ConfirmAlertModalData>()
  const showModalConfirm = (data: ConfirmAlertModalData) => {
    setModalData(data)
  }
  const hideModalConfirm = () => {
    setModalData(undefined)
  }

  const { data: priceAlertStat = {} as PriceAlertStat } = useGetAlertStatsQuery()
  const navigate = useNavigate()
  const goBack = () => {
    navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PRICE_ALERTS}`)
  }

  return (
    <div className="flex flex-col gap-4 px-6 pb-4 max-md:px-0 max-md:pb-4">
      <div className="flex w-full flex-col">
        <div
          onClick={goBack}
          role="button"
          className="flex h-[60px] w-fit -translate-x-1 cursor-pointer items-center max-md:px-4"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">
            <Trans>Create Alert</Trans>
          </span>
        </div>

        <div className="border-t border-solid border-border pt-3 text-xs leading-4 text-subText max-md:px-4">
          <Trans>
            We will use our Aggregator to regularly monitor price changes based on your alert conditions below. When the
            price alert is triggered, we will send you a notification
          </Trans>
        </div>
      </div>

      <CreateAlertForm showModalConfirm={showModalConfirm} priceAlertStat={priceAlertStat} />

      {modalData && <ConfirmModal data={modalData} onDismiss={hideModalConfirm} priceAlertStat={priceAlertStat} />}
    </div>
  )
}
