import { ReactNode } from 'react'
import { Repeat } from 'react-feather'

import { ReactComponent as BridgeIcon } from 'assets/svg/bridge_icon.svg'
import { ReactComponent as LimitOrderIcon } from 'assets/svg/limit_order.svg'
import { ReactComponent as LiquidityIcon } from 'assets/svg/liquidity_icon.svg'
import SendIcon from 'components/Icons/SendIcon'
import VoteIcon from 'components/Icons/Vote'
import { TRANSACTION_GROUP, TRANSACTION_TYPE, TransactionDetails } from 'state/transactions/type'

const MAP_ICON_BY_GROUP: { [group in TRANSACTION_GROUP]: ReactNode } = {
  [TRANSACTION_GROUP.SWAP]: <Repeat size={16} />,
  [TRANSACTION_GROUP.LIQUIDITY]: <LiquidityIcon />,
  [TRANSACTION_GROUP.TRANSFER]: <SendIcon />,
  [TRANSACTION_GROUP.KYBERDAO]: <VoteIcon size={22} />,
  [TRANSACTION_GROUP.OTHER]: null,
}
const MAP_ICON_BY_TYPE: Partial<Record<TRANSACTION_TYPE, ReactNode>> = {
  [TRANSACTION_TYPE.CANCEL_LIMIT_ORDER]: <LimitOrderIcon />,
  [TRANSACTION_TYPE.BRIDGE]: <BridgeIcon />,
}

const Icon = ({ txs }: { txs: TransactionDetails }) => {
  const icon = MAP_ICON_BY_GROUP[txs.group] || MAP_ICON_BY_TYPE[txs.type] || <small>[fake_icon]</small>
  return icon as JSX.Element
}
export default Icon
