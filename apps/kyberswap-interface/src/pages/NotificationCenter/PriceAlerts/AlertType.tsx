import { t } from '@lingui/macro'
import { ArrowDown, ArrowUp } from 'react-feather'

import { PriceAlertType } from 'pages/NotificationCenter/const'

type Props = {
  type: PriceAlertType
}

const labelByType: () => Record<PriceAlertType, string> = () => ({
  [PriceAlertType.ABOVE]: t`above`,
  [PriceAlertType.BELOW]: t`below`,
})

const AlertType: React.FC<Props> = ({ type }) => {
  return (
    <span
      className={`inline-flex items-center gap-[2px] ${type === PriceAlertType.ABOVE ? 'text-primary' : 'text-red'}`}
    >
      {type === PriceAlertType.ABOVE ? <ArrowUp size={18} /> : <ArrowDown size={18} />} {labelByType()[type]}
    </span>
  )
}

export default AlertType
