import { useEffect, useState } from 'react'

import { DeltaNft } from 'components/WalletPopup/Transactions/DeltaTokenAmount'
import { useActiveWeb3React } from 'hooks'
import { getTokenId } from 'pages/Earns/utils'
import { EarnMigrateLiquidityExtraInfo, TransactionDetails } from 'state/transactions/type'
import { getTransactionStatus } from 'utils/transaction'

export default function MigrateLiquidityDescription(transaction: TransactionDetails) {
  const { chainId } = useActiveWeb3React()
  const { extraInfo = {} } = transaction
  const {
    sourcePool,
    sourceDexLogoUrl,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sourceDex,
    destinationPool,
    destinationDexLogoUrl,
    destinationDex,
    positionId,
  } = extraInfo as EarnMigrateLiquidityExtraInfo
  const [tokenId, setTokenId] = useState<string | null>(null)

  const { success } = getTransactionStatus(transaction)

  useEffect(() => {
    if (!success) return
    getTokenId(chainId, transaction.hash, destinationDex)
      .then(id => {
        if (id) setTokenId(id.toString())
        else setTokenId(null)
      })
      .catch(error => console.error('failed to get token id', error))
  }, [chainId, transaction.hash, destinationDex, success])

  return !success ? null : (
    <>
      <DeltaNft hideSign poolName={sourcePool} logoUrl={sourceDexLogoUrl} nftId={`#${positionId}`} plus={false} />
      <DeltaNft
        hideSign
        poolName={destinationPool}
        logoUrl={destinationDexLogoUrl}
        nftId={tokenId ? `#${tokenId}` : ''}
        plus
      />
    </>
  )
}
