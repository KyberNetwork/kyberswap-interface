import { ReactNode } from 'react'
import { Repeat } from 'react-feather'
import { DefaultTheme } from 'styled-components'

import { ReactComponent as ApproveIcon } from 'assets/svg/approve_icon.svg'
import { ReactComponent as BridgeIcon } from 'assets/svg/bridge_icon.svg'
import { ReactComponent as CrossChain } from 'assets/svg/cross_chain_icon.svg'
import { ReactComponent as LiquidityIcon } from 'assets/svg/liquidity_icon.svg'
import { ReactComponent as ThunderIcon } from 'assets/svg/thunder_icon.svg'
import { MoneyBag } from 'components/Icons'
import IconFailure from 'components/Icons/Failed'
import IconSprite from 'components/Icons/Icon'
import SendIcon from 'components/Icons/SendIcon'
import StakeIcon from 'components/Icons/Stake'
import VoteIcon from 'components/Icons/Vote'
import useTheme from 'hooks/useTheme'
import { TRANSACTION_GROUP, TRANSACTION_TYPE, TransactionDetails } from 'state/transactions/type'

const MAP_ICON_BY_GROUP: { [group in TRANSACTION_GROUP]: ReactNode } = {
  [TRANSACTION_GROUP.SWAP]: <Repeat size={16} />,
  [TRANSACTION_GROUP.LIQUIDITY]: <LiquidityIcon />,
  [TRANSACTION_GROUP.KYBERDAO]: <VoteIcon size={22} />,
  [TRANSACTION_GROUP.OTHER]: null,
}

const MAP_ICON_BY_TYPE: (theme: DefaultTheme) => Partial<Record<TRANSACTION_TYPE, ReactNode>> = (
  theme: DefaultTheme,
) => ({
  [TRANSACTION_TYPE.KYBERDAO_CLAIM_GAS_REFUND]: <IconSprite id="refund" size={16} color={theme.subText} />, //todo namgold: test this
  [TRANSACTION_TYPE.CANCEL_LIMIT_ORDER]: <IconFailure size={18} />,
  [TRANSACTION_TYPE.BRIDGE]: <BridgeIcon />,
  [TRANSACTION_TYPE.CROSS_CHAIN_SWAP]: <CrossChain />,
  [TRANSACTION_TYPE.APPROVE]: <ApproveIcon width={20} height={22} />,
  [TRANSACTION_TYPE.CLAIM_REWARD]: <MoneyBag size={18} />,
  [TRANSACTION_TYPE.TRANSFER_TOKEN]: <SendIcon />,
  [TRANSACTION_TYPE.KYBERDAO_STAKE]: <StakeIcon size={18} />,
  [TRANSACTION_TYPE.KYBERDAO_MIGRATE]: <ThunderIcon />,
  [TRANSACTION_TYPE.KYBERDAO_UNSTAKE]: <StakeIcon size={18} style={{ transform: 'scaleY(-1)' }} />,
})

const Icon = ({ txs }: { txs: TransactionDetails }) => {
  const theme = useTheme()
  const icon = MAP_ICON_BY_TYPE(theme)[txs.type] || MAP_ICON_BY_GROUP[txs.group] || <Repeat size={16} />
  return icon as JSX.Element
}
export default Icon
