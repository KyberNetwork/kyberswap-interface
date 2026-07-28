import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'

import CreateAlertButton from 'pages/NotificationCenter/PriceAlerts/CreateAlertButton'
import { MEDIA_WIDTHS } from 'theme'

const TitleOnMobile = () => {
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  if (!upToMedium) {
    return null
  }

  return (
    <div className="flex h-[60px] items-center justify-between bg-tableHeader px-4">
      <span className="font-medium text-text">
        <Trans>Price Alert</Trans>
      </span>

      <CreateAlertButton />
    </div>
  )
}

export default TitleOnMobile
