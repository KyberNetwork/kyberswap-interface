import { ReactNode } from 'react'
import { FileText, Repeat } from 'react-feather'

import { ReactComponent as ApproveIcon } from 'assets/svg/approve_icon.svg'
import SendIcon from 'components/Icons/SendIcon'

const MAP_ICON_BY_TYPE: Record<string, ReactNode> = {
  approve: <ApproveIcon width={20} height={22} />,
  send: <SendIcon />,
  swap: <Repeat size={16} />,
}

export const getTxsIcon = (type: string) => {
  return MAP_ICON_BY_TYPE[type.toLowerCase()] || <FileText size={16} />
}
