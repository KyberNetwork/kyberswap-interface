import { useMedia } from 'react-use'

import { CrossChainTransfer } from 'pages/CrossChain/useTransferHistory'
import { MEDIA_WIDTHS } from 'theme'

import Desktop from './Desktop'
import Mobile from './Mobile'

export type Props = {
  transfers: CrossChainTransfer[]
}

const TransferHistoryTable: React.FC<Props> = props => {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  if (upToExtraSmall) {
    return <Mobile {...props} />
  }

  return <Desktop {...props} />
}

export default TransferHistoryTable
