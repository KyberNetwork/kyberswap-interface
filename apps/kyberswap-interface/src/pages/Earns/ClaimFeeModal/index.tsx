import { t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { NotificationType } from 'components/Announcement/type'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import Row from 'components/Row'
import { ZERO_ADDRESS } from 'constants/index'
import { useWeb3React } from 'hooks'
import { useSigningContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { ClaimInfo, ClaimInfoRow, ClaimInfoWrapper, ModalHeader, Wrapper, X } from 'pages/Earns/ClaimFeeModal/styles'
import { FeeInfo } from 'pages/Earns/PositionDetail/LeftSection'
import {
  DEXES_SUPPORT_COLLECT_FEE,
  EarnDex,
  NFT_MANAGER_ABI,
  NFT_MANAGER_CONTRACT,
  UNWRAP_WNATIVE_TOKEN_FUNC,
} from 'pages/Earns/constants'
import { ParsedPosition } from 'pages/Earns/types'
import { useNotify } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export default function ClaimFeeModal({
  claiming,
  setClaiming,
  setClaimTx,
  position,
  feeInfo,
  onClose,
}: {
  claiming: boolean
  setClaiming: (claiming: boolean) => void
  setClaimTx: (tx: string | null) => void
  position: ParsedPosition
  feeInfo: FeeInfo
  onClose: () => void
}) {
  const { library, account, chainId } = useWeb3React()
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const addTransactionWithType = useTransactionAdder()
  const notify = useNotify()
  const { changeNetwork } = useChangeNetwork()

  const [autoClaim, setAutoClaim] = useState(false)

  const nftManagerContractOfDex = NFT_MANAGER_CONTRACT[position.dex.id as keyof typeof NFT_MANAGER_CONTRACT]
  const nftManagerContract =
    typeof nftManagerContractOfDex === 'string'
      ? nftManagerContractOfDex
      : nftManagerContractOfDex[position.chain.id as keyof typeof nftManagerContractOfDex]
  const nftManagerAbi = NFT_MANAGER_ABI[position.dex.id as keyof typeof NFT_MANAGER_ABI]
  const contract = useSigningContract(nftManagerContract, nftManagerAbi)

  const { token0, token1 } = position

  const nativeToken = position.pool.nativeToken

  const handleCollectFees = useCallback(async () => {
    if (!library || !contract || !DEXES_SUPPORT_COLLECT_FEE[position.dex.id as EarnDex]) return
    const accounts = await library.listAccounts()
    if (chainId !== position.chain.id || !accounts.length) {
      if (chainId !== position.chain.id) changeNetwork(position.chain.id)
      setAutoClaim(true)
      return
    }
    setClaiming(true)

    const tokenId = position.tokenId
    const recipient = account
    const maxUnit = '0x' + (2n ** 128n - 1n).toString(16)
    const calldatas = []

    try {
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
        const ethAmount = token0.isNative ? feeInfo.balance0 : feeInfo.balance1
        const token = token0.isNative ? token1.address : token0.address
        const tokenAmount = token0.isNative ? feeInfo.balance1 : feeInfo.balance0

        // Encode the unwrapWETH9 call
        const unwrapWNativeTokenFuncName =
          UNWRAP_WNATIVE_TOKEN_FUNC[position.dex.id as keyof typeof UNWRAP_WNATIVE_TOKEN_FUNC]
        if (!unwrapWNativeTokenFuncName) return
        const unwrapWETH9CallData = contract.interface.encodeFunctionData(unwrapWNativeTokenFuncName, [
          ethAmount,
          recipient,
        ])

        // Encode the sweepToken call
        const sweepTokenCallData = contract.interface.encodeFunctionData('sweepToken', [token, tokenAmount, recipient])

        calldatas.push(unwrapWETH9CallData)
        calldatas.push(sweepTokenCallData)
      }

      // Combine calls in multicall
      const multicallData = contract.interface.encodeFunctionData('multicall', [calldatas])

      // Send transaction
      const tx = await library.getSigner().sendTransaction({
        to: owner !== account ? owner : nftManagerContract,
        data: multicallData,
      })
      addTransactionWithType({
        type: TRANSACTION_TYPE.COLLECT_FEE,
        hash: tx.hash,
        extraInfo: {
          tokenAmountIn: formatDisplayNumber(feeInfo.amount0, { significantDigits: 4 }),
          tokenAmountOut: formatDisplayNumber(feeInfo.amount1, { significantDigits: 4 }),
          tokenAddressIn: token0.address,
          tokenAddressOut: token1.address,
          tokenSymbolIn: token0.isNative ? nativeToken.symbol : token0.symbol,
          tokenSymbolOut: token1.isNative ? nativeToken.symbol : token1.symbol,
          arbitrary: {
            token_1: token0.symbol,
            token_2: token1.symbol,
            token_1_amount: formatDisplayNumber(feeInfo.amount0, { significantDigits: 4 }),
            token_2_amount: formatDisplayNumber(feeInfo.amount1, { significantDigits: 4 }),
          },
        },
      })
      setClaimTx(tx.hash)
    } catch (error) {
      console.error(error)
      notify({
        title: t`Error`,
        type: NotificationType.ERROR,
        summary: error.message,
      })
      setClaiming(false)
    }
  }, [
    account,
    addTransactionWithType,
    chainId,
    changeNetwork,
    contract,
    feeInfo.amount0,
    feeInfo.amount1,
    feeInfo.balance0,
    feeInfo.balance1,
    library,
    nativeToken.symbol,
    nftManagerContract,
    notify,
    position.chain.id,
    position.dex.id,
    position.tokenId,
    setClaimTx,
    setClaiming,
    token0.address,
    token0.isNative,
    token0.symbol,
    token1.address,
    token1.isNative,
    token1.symbol,
  ])

  useEffect(() => {
    if (autoClaim && chainId === position.chain.id) {
      handleCollectFees()
      setAutoClaim(false)
    }
  }, [chainId, position.chain.id, handleCollectFees, autoClaim])

  return (
    <Modal isOpen onDismiss={onClose}>
      <Wrapper>
        <ModalHeader>
          <Text fontSize={20} fontWeight={500}>
            {t`Claim Fees`}
          </Text>
          <X onClick={onClose} />
        </ModalHeader>
        <ClaimInfoWrapper>
          <Text color={theme.subText}>{t`You are currently claiming`}</Text>
          <ClaimInfo>
            <Flex alignItems={'center'} justifyContent={'space-between'}>
              <Text fontSize={14} color={theme.subText}>{t`Total Value`}</Text>
              <Text fontSize={18}>
                {formatDisplayNumber(feeInfo.totalValue, { style: 'currency', significantDigits: 4 })}
              </Text>
            </Flex>
            <ClaimInfoRow
              tokenImage={token0.isNative ? nativeToken.logo : token0.logo}
              dexImage={position.chain.logo}
              tokenAmount={feeInfo.amount0}
              tokenSymbol={token0.isNative ? nativeToken.symbol : token0.symbol}
              tokenUsdValue={feeInfo.value0}
            />
            <ClaimInfoRow
              tokenImage={token1.isNative ? nativeToken.logo : token1.logo}
              dexImage={position.chain.logo}
              tokenAmount={feeInfo.amount1}
              tokenSymbol={token1.isNative ? nativeToken.symbol : token1.symbol}
              tokenUsdValue={feeInfo.value1}
            />
          </ClaimInfo>
        </ClaimInfoWrapper>
        <Row gap="16px" flexDirection={upToExtraSmall ? 'column' : 'row'}>
          <ButtonOutlined onClick={onClose}>{t`Cancel`}</ButtonOutlined>
          <ButtonPrimary gap="4px" disabled={claiming} onClick={handleCollectFees}>
            {claiming && <Loader stroke={'#505050'} />}
            {claiming ? t`Claiming` : t`Claim`}
          </ButtonPrimary>
        </Row>
      </Wrapper>
    </Modal>
  )
}
