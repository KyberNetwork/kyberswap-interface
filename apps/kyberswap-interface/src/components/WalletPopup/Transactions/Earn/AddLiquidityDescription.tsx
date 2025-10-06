import { useEffect, useState } from 'react'

import DeltaTokenAmount, { DeltaNft } from 'components/WalletPopup/Transactions/DeltaTokenAmount'
import { useWeb3React } from 'hooks'
import { CoreProtocol } from 'pages/Earns/constants'
import { getTokenId, isForkFrom } from 'pages/Earns/utils'
import { EarnAddLiquidityExtraInfo, TransactionDetails } from 'state/transactions/type'
import { getTransactionStatus } from 'utils/transaction'

export default function AddLiquidityDescription(transaction: TransactionDetails) {
  const { library } = useWeb3React()
  const { extraInfo = {} } = transaction
  const { tokensIn, pool, positionId, dexLogoUrl, dex } = extraInfo as EarnAddLiquidityExtraInfo
  const [tokenId, setTokenId] = useState<string | null>(null)

  const { success } = getTransactionStatus(transaction)
  const isUniV4 = isForkFrom(dex, CoreProtocol.UniswapV4)

  useEffect(() => {
    if (library && !positionId) {
      getTokenId(library, transaction.hash, isUniV4)
        .then(id => {
          if (id) setTokenId(id.toString())
          else setTokenId(null)
        })
        .catch(error => console.log('failed to get token id', error))
    }
  }, [library, transaction.hash, isUniV4, positionId])

  return !success ? null : (
    <>
      <DeltaNft
        hideSign={!!positionId}
        poolName={pool}
        logoUrl={dexLogoUrl}
        nftId={positionId ? `#${positionId}` : tokenId ? `#${tokenId}` : ''}
        plus
      />
      {tokensIn.map(token => (
        <DeltaTokenAmount
          key={token.symbol}
          logoURL={token.logoUrl}
          symbol={token.symbol}
          amount={token.amount}
          plus={false}
        />
      ))}
    </>
  )
}
