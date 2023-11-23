import { ChainId } from '@kyberswap/ks-sdk-core'

import TokenAllocation from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/TokenAllocation'
import WalletInfo from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/WalletInfo'

const Tokens = (props: { walletAddresses: string[]; chainIds: ChainId[] }) => {
  return (
    <>
      <TokenAllocation {...props} />
      <WalletInfo {...props} />
    </>
  )
}
export default Tokens
