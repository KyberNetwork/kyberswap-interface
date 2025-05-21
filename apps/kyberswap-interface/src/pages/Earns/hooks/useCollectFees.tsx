import { t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { ZERO_ADDRESS } from 'constants/index'
import { NativeToken } from 'constants/networks/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import ClaimModal, { ClaimInfo, ClaimType } from 'pages/Earns/components/ClaimModal'
import { DEXES_SUPPORT_COLLECT_FEE, UNWRAP_WNATIVE_TOKEN_FUNC } from 'pages/Earns/constants'
import { ParsedPosition } from 'pages/Earns/types'
import { getNftManagerContract, submitTransaction } from 'pages/Earns/utils'
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

    const contract = getNftManagerContract(claimInfo.dex, claimInfo.chainId, library)
    if (!contract) return

    setClaiming(true)

    const tokenId = claimInfo.nftId
    const recipient = account
    const maxUnit = '0x' + (2n ** 128n - 1n).toString(16)
    const calldatas = []

    const token0 = claimInfo.tokens[0]
    const token1 = claimInfo.tokens[1]
    const nativeToken = claimInfo.nativeToken as NativeToken

    const owner = await contract.ownerOf(tokenId)
    const involvesETH = token0.isNative || token1.isNative
    const collectParams = {
      tokenId,
      recipient: involvesETH ? ZERO_ADDRESS : account,
      amount0Max: maxUnit,
      amount1Max: maxUnit,
    }
    const collectCallData = contract.interface.encodeFunctionData('collect', [collectParams])
    calldatas.push(collectCallData)

    if (involvesETH) {
      const ethAmount = token0.isNative ? token0.balance : token1.balance
      const token = token0.isNative ? token1.address : token0.address
      const tokenAmount = token0.isNative ? token1.balance : token0.balance

      const unwrapWNativeTokenFuncName =
        UNWRAP_WNATIVE_TOKEN_FUNC[claimInfo.dex as keyof typeof UNWRAP_WNATIVE_TOKEN_FUNC]
      if (!unwrapWNativeTokenFuncName) return
      const unwrapWETH9CallData = contract.interface.encodeFunctionData(unwrapWNativeTokenFuncName, [
        ethAmount,
        recipient,
      ])

      const sweepTokenCallData = contract.interface.encodeFunctionData('sweepToken', [token, tokenAmount, recipient])

      calldatas.push(unwrapWETH9CallData)
      calldatas.push(sweepTokenCallData)
    }

    const multicallData = contract.interface.encodeFunctionData('multicall', [calldatas])

    const txHash = await submitTransaction({
      library,
      txData: {
        to: owner !== account ? owner : contract.address,
        data: multicallData,
      },
      onError: (error: Error) => {
        notify({
          title: t`Error`,
          type: NotificationType.ERROR,
          summary: error.message,
        })
        setClaiming(false)
      },
    })
    if (!txHash) throw new Error('Transaction failed')
    setTxHash(txHash)
    addTransactionWithType({
      type: TRANSACTION_TYPE.COLLECT_FEE,
      hash: txHash,
      extraInfo: {
        tokenAmountIn: formatDisplayNumber(token0.amount, { significantDigits: 4 }),
        tokenAmountOut: formatDisplayNumber(token1.amount, { significantDigits: 4 }),
        tokenAddressIn: token0.address,
        tokenAddressOut: token1.address,
        tokenSymbolIn: token0.isNative ? nativeToken.symbol : token0.symbol,
        tokenSymbolOut: token1.isNative ? nativeToken.symbol : token1.symbol,
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
    setClaimInfo({
      nftId: position.tokenId,
      dex: position.dex.id,
      chainId: position.chain.id,
      tokens: [
        {
          logo: position.token0.logo,
          symbol: position.token0.symbol,
          amount: position.token0.unclaimedAmount,
          value: position.token0.unclaimedValue,
          address: position.token0.address,
          isNative: position.token0.isNative,
          balance: position.token0.unclaimedBalance,
        },
        {
          logo: position.token1.logo,
          symbol: position.token1.symbol,
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
