import { useEffect, useState } from 'react'

import { DeltaNft } from 'components/WalletPopup/Transactions/DeltaTokenAmount'
import { useWeb3React } from 'hooks'
import { getTokenId } from 'pages/Earns/utils'
import { EarnMigrateLiquidityExtraInfo, TransactionDetails } from 'state/transactions/type'
import { getTransactionStatus } from 'utils/transaction'

export default function MigrateLiquidityDescription(transaction: TransactionDetails) {
  const { library } = useWeb3React()
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
    if (library) {
      getTokenId(library, transaction.hash, destinationDex)
        .then(id => {
          if (id) setTokenId(id.toString())
          else setTokenId(null)
        })
        .catch(error => console.log('failed to get token id', error))
    }
  }, [library, transaction.hash, destinationDex])

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
