import DeltaTokenAmount, { DeltaNft } from 'components/WalletPopup/Transactions/DeltaTokenAmount'
import { EarnRemoveLiquidityExtraInfo, TransactionDetails } from 'state/transactions/type'
import { getTransactionStatus } from 'utils/transaction'

export default function RemoveLiquidityDescription(transaction: TransactionDetails) {
  const { extraInfo = {} } = transaction
  const { tokensOut, pool, positionId, dexLogoUrl } = extraInfo as EarnRemoveLiquidityExtraInfo

  const { success } = getTransactionStatus(transaction)

  return !success ? null : (
    <>
      <DeltaNft hideSign poolName={pool} logoUrl={dexLogoUrl} nftId={`#${positionId}`} plus={false} />
      {tokensOut.map(token => (
        <DeltaTokenAmount key={token.symbol} logoURL={token.logoUrl} symbol={token.symbol} amount={token.amount} plus />
      ))}
    </>
  )
}
