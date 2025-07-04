import { WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import ClaimModal, { ClaimInfo, ClaimType } from 'pages/Earns/components/ClaimModal'
import { CoreProtocol, DEXES_SUPPORT_COLLECT_FEE } from 'pages/Earns/constants'
import { ParsedPosition } from 'pages/Earns/types'
import { getNftManagerContract, isForkFrom, isNativeToken, submitTransaction } from 'pages/Earns/utils'
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
    console.log('txData', txData)

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

  const onCloseClaim = useCallback(() => {
    setOpenClaimModal(false)
    setClaimInfo(null)
  }, [])

  const onOpenClaim = (position: ParsedPosition) => {
    setOpenClaimModal(true)

    const {
      dex,
      chainId,
      id,
      token0Address,
      token1Address,
      token0Logo: parsedToken0Logo,
      token1Logo: parsedToken1Logo,
      token0Symbol: parsedToken0Symbol,
      token1Symbol: parsedToken1Symbol,
      nativeToken,
      token0UnclaimedAmount,
      token1UnclaimedAmount,
      token0UnclaimedValue,
      token1UnclaimedValue,
      token0UnclaimedBalance,
      token1UnclaimedBalance,
    } = position
    const isUniV3 = isForkFrom(dex, CoreProtocol.UniswapV3)

    const isToken0Native = isNativeToken(token0Address, chainId as keyof typeof WETH)
    const isToken1Native = isNativeToken(token1Address, chainId as keyof typeof WETH)

    const token0Logo = isUniV3 && isToken0Native ? nativeToken.logo : parsedToken0Logo
    const token1Logo = isUniV3 && isToken1Native ? nativeToken.logo : parsedToken1Logo

    const token0Symbol = isUniV3 && isToken0Native ? nativeToken.symbol : parsedToken0Symbol
    const token1Symbol = isUniV3 && isToken1Native ? nativeToken.symbol : parsedToken1Symbol

    setClaimInfo({
      nftId: id,
      dex,
      chainId,
      tokens: [
        {
          logo: token0Logo,
          symbol: token0Symbol,
          amount: token0UnclaimedAmount,
          value: token0UnclaimedValue,
          address: token0Address,
          isNative: isToken0Native,
          balance: token0UnclaimedBalance,
        },
        {
          logo: token1Logo,
          symbol: token1Symbol,
          amount: token1UnclaimedAmount,
          value: token1UnclaimedValue,
          address: token1Address,
          isNative: isToken1Native,
          balance: token1UnclaimedBalance,
        },
      ],
      nativeToken,
      totalValue: token0UnclaimedValue + token1UnclaimedValue,
    })
  }

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
      <ClaimModal
        claimType={ClaimType.FEES}
        claiming={claiming}
        claimInfo={claimInfo}
        onClaim={handleClaim}
        onClose={onCloseClaim}
      />
    ) : null

  return { claiming, claimModal, onOpenClaim }
}

export default useCollectFees
