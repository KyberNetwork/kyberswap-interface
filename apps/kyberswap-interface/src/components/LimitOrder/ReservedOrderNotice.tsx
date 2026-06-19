import { Trans } from '@lingui/macro'
import { Link } from 'react-router-dom'

const ReservedOrderNotice = ({ symbol, to }: { symbol: string | undefined; to: string }) => (
  <span className="text-xs font-medium italic text-subText">
    <Trans>
      <span className="text-text">Notice</span>: Some of your {symbol} is already reserved by an open Limit Order -
      review it <Link to={to}>here</Link>.
    </Trans>
  </span>
)

export default ReservedOrderNotice
