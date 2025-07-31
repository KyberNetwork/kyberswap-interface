import { t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import ClaimModal, { ClaimInfo, ClaimType } from 'pages/Earns/components/ClaimModal'
import { CoreProtocol, DEXES_SUPPORT_COLLECT_FEE } from 'pages/Earns/constants'
import useCompounding from 'pages/Earns/hooks/useCompounding'
import { ParsedPosition } from 'pages/Earns/types'
import { getNftManagerContract, isForkFrom, submitTransaction } from 'pages/Earns/utils'
import { getUniv3CollectCallData, getUniv4CollectCallData } from 'pages/Earns/utils/fees'
import { useNotify } from 'state/application/hooks'
import { useAllTransactions, useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { formatDisplayNumber } from 'utils/numbers'

const useCollectFees = ({ refetchAfterCollect }: { refetchAfterCollect: () => void }) => {
  const notify = useNotify()
  const addTransactionWithType = useTransactionAdder()
  const allTransactions = useAllTransactions(true)

  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()

  const [claimInfo, setClaimInfo] = useState<ClaimInfo | null>(null)
  const [openClaimModal, setOpenClaimModal] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  const [position, setPosition] = useState<ParsedPosition | null>(null)

  const onCloseClaim = useCallback(() => {
    setOpenClaimModal(false)
    setClaimInfo(null)
    setPosition(null)
  }, [])

  const { widget: compoundingWidget, handleOpenCompounding } = useCompounding({
    onRefreshPosition: refetchAfterCollect,
    onCloseClaimModal: onCloseClaim,
  })

  const handleClaim = useCallback(async () => {
    if (!library || !claimInfo?.dex || !DEXES_SUPPORT_COLLECT_FEE[claimInfo.dex]) return

    const contract = getNftManagerContract(claimInfo.dex, claimInfo.chainId)
    if (!contract) return

    const token0 = claimInfo.tokens[0]
    const token1 = claimInfo.tokens[1]
    if (!token0.address || !token1.address) return

    setClaiming(true)

    const isUniv4 = isForkFrom(claimInfo.dex, CoreProtocol.UniswapV4)

    const txData = isUniv4
      ? await getUniv4CollectCallData({ claimInfo, recipient: account })
      : await getUniv3CollectCallData({ claimInfo, recipient: account })

    if (!txData) return

    let errorMessage = ''

    const res = await submitTransaction({
      library,
      txData,
      onError: (error: Error) => {
        errorMessage = error.message
        notify({
          title: t`Error`,
          type: NotificationType.ERROR,
          summary: error.message,
        })
        setClaiming(false)
      },
    })
    const { txHash, error } = res
    if (!txHash || error) {
      if (error?.message && error.message !== errorMessage)
        notify({
          title: t`Error`,
          type: NotificationType.ERROR,
          summary: error?.message || 'Transaction failed',
        })
      throw new Error(error?.message || 'Transaction failed')
    }

    setTxHash(txHash)

    addTransactionWithType({
      type: TRANSACTION_TYPE.COLLECT_FEE,
      hash: txHash,
      extraInfo: {
        tokenAmountIn: formatDisplayNumber(token0.amount, { significantDigits: 4 }),
        tokenAmountOut: formatDisplayNumber(token1.amount, { significantDigits: 4 }),
        tokenAddressIn: token0.address,
        tokenAddressOut: token1.address,
        tokenSymbolIn: token0.symbol,
        tokenSymbolOut: token1.symbol,
        arbitrary: {
          token_1: token0.symbol,
          token_2: token1.symbol,
          token_1_amount: formatDisplayNumber(token0.amount, { significantDigits: 4 }),
          token_2_amount: formatDisplayNumber(token1.amount, { significantDigits: 4 }),
        },
      },
    })
  }, [account, addTransactionWithType, claimInfo, library, notify])

  const onOpenClaim = (position: ParsedPosition) => {
    setOpenClaimModal(true)
    const isUniV3 = isForkFrom(position.dex.id, CoreProtocol.UniswapV3)
    const { token0, token1, pool } = position
    const { nativeToken } = pool

    const token0Logo = isUniV3 && token0.isNative ? nativeToken.logo : token0.logo
    const token1Logo = isUniV3 && token1.isNative ? nativeToken.logo : token1.logo

    const token0Symbol = isUniV3 && token0.isNative ? nativeToken.symbol : token0.symbol
    const token1Symbol = isUniV3 && token1.isNative ? nativeToken.symbol : token1.symbol

    setClaimInfo({
      nftId: position.tokenId,
      dex: position.dex.id,
      chainId: position.chain.id,
      tokens: [
        {
          logo: token0Logo,
          symbol: token0Symbol,
          amount: position.token0.unclaimedAmount,
          value: position.token0.unclaimedValue,
          address: position.token0.address,
          isNative: position.token0.isNative,
          balance: position.token0.unclaimedBalance,
        },
        {
          logo: token1Logo,
          symbol: token1Symbol,
          amount: position.token1.unclaimedAmount,
          value: position.token1.unclaimedValue,
          address: position.token1.address,
          isNative: position.token1.isNative,
          balance: position.token1.unclaimedBalance,
        },
      ],
      nativeToken: position.pool.nativeToken,
      totalValue: position.token0.unclaimedValue + position.token1.unclaimedValue,
    })
    setPosition(position)
  }

  const onCompound = useCallback(() => {
    if (!position) return
    handleOpenCompounding({
      pool: {
        chainId: position.chain.id,
        address: position.pool.address,
        dex: position.dex.id,
      },
      positionId: position.tokenId,
      initDepositTokens: position.token0.address + ',' + position.token1.address,
      initAmounts: position.token0.unclaimedAmount + ',' + position.token1.unclaimedAmount,
    })
  }, [handleOpenCompounding, position])

  useEffect(() => {
    if (txHash && allTransactions && allTransactions[txHash]) {
      const tx = allTransactions[txHash]
      if (tx?.[0].receipt && tx?.[0].receipt.status === 1) {
        setClaiming(false)
        setTxHash(null)
        setOpenClaimModal(false)
        refetchAfterCollect()
      }
    }
  }, [allTransactions, refetchAfterCollect, txHash])

  const claimModal =
    openClaimModal && claimInfo ? (
      <>
        <ClaimModal
          claimType={ClaimType.FEES}
          claiming={claiming}
          claimInfo={claimInfo}
          compoundable
          onCompound={onCompound}
          onClaim={handleClaim}
          onClose={onCloseClaim}
        />
        {compoundingWidget}
      </>
    ) : null

  return { claiming, claimModal, onOpenClaim }
}

export default useCollectFees
