import { ExternalLink as ExternalLinkIcon } from 'react-feather'

import { isSupportedChainId } from 'constants/networks'
import { ShortenedId } from 'pages/CopyTrading/components/common/layout'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils/explorer'

export const TxHashLink = ({ chainId, txHash }: { chainId: number; txHash?: string }) => {
  if (!txHash || !isSupportedChainId(chainId)) return <ShortenedId value={txHash} />

  return (
    <ExternalLink
      aria-label="Open transaction in explorer"
      className="inline-flex items-center gap-1 text-subText hover:brightness-125"
      href={getEtherscanLink(chainId, txHash, 'transaction')}
    >
      <ShortenedId value={txHash} />
      <ExternalLinkIcon className="shrink-0" size={12} />
    </ExternalLink>
  )
}
