import { ChainId } from '@kyberswap/ks-sdk-core'

import TokenAllocation from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/TokenAllocation'
import WalletInfo from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/WalletInfo'

const Tokens = ({
  mobile,
  ...props
}: {
  walletAddresses: string[]
  chainIds: ChainId[]
  shareMode?: boolean
  mobile?: boolean
}) => {
  return (
    <>
      <TokenAllocation {...props} mobile={mobile} />
      {!props.shareMode && <WalletInfo {...props} />}
    </>
  )
}
export default Tokens
