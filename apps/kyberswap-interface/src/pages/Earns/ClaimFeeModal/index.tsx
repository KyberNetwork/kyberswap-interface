import { WETH } from '@kyberswap/ks-sdk-core'
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
import { NETWORKS_INFO } from 'constants/networks'
import { useWeb3React } from 'hooks'
import { useSigningContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { FeeInfo } from 'pages/Earns/PositionDetail/LeftSection'
import {
  DEXES_SUPPORT_COLLECT_FEE,
  EarnChain,
  EarnDex,
  NATIVE_ADDRESSES,
  NFT_MANAGER_ABI,
  NFT_MANAGER_CONTRACT,
  UNWRAP_WNATIVE_TOKEN_FUNC,
} from 'pages/Earns/constants'
import { useNotify } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import { ClaimInfo, ClaimInfoRow, ClaimInfoWrapper, ModalHeader, Wrapper, X } from 'pages/Earns/ClaimFeeModal/styles'

export interface PositionToClaim {
  id: string
  dex: {
    id: string
  }
  chain: {
    id: number
    logo: string
  }
  token0: {
    address: string
    symbol: string
    logo: string
  }
  token1: {
    address: string
    symbol: string
    logo: string
  }
}

export const isNativeToken = (tokenAddress: string, chainId: keyof typeof WETH) =>
  NATIVE_ADDRESSES[chainId as EarnChain] === tokenAddress.toLowerCase() ||
  (WETH[chainId] && tokenAddress.toLowerCase() === WETH[chainId].address)

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
  position: PositionToClaim
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

  const isToken0Native = isNativeToken(position.token0.address, position.chain.id as keyof typeof WETH)
  const isToken1Native = isNativeToken(position.token1.address, position.chain.id as keyof typeof WETH)

  const nativeToken = NETWORKS_INFO[position.chain.id as keyof typeof NETWORKS_INFO].nativeToken

  const handleCollectFees = useCallback(async () => {
    if (!library || !contract || !DEXES_SUPPORT_COLLECT_FEE[position.dex.id as EarnDex]) return
    const accounts = await library.listAccounts()
    if (chainId !== position.chain.id || !accounts.length) {
      if (chainId !== position.chain.id) changeNetwork(position.chain.id)
      setAutoClaim(true)
      return
    }
    setClaiming(true)

    const tokenId = position.id
    const recipient = account
    const maxUnit = '0x' + (2n ** 128n - 1n).toString(16)
    const calldatas = []

    try {
      const owner = await contract.ownerOf(position.id)
      const involvesETH = isToken0Native || isToken1Native
      const collectParams = {
        tokenId,
        recipient: involvesETH ? ZERO_ADDRESS : account,
        amount0Max: maxUnit,
        amount1Max: maxUnit,
      }
      const collectCallData = contract.interface.encodeFunctionData('collect', [collectParams])
      calldatas.push(collectCallData)

      if (involvesETH) {
        const ethAmount = isToken0Native ? feeInfo.balance0 : feeInfo.balance1
        const token = isToken0Native ? position.token1.address : position.token0.address
        const tokenAmount = isToken0Native ? feeInfo.balance1 : feeInfo.balance0

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
          tokenAddressIn: position.token0.address,
          tokenAddressOut: position.token1.address,
          tokenSymbolIn: isToken0Native ? nativeToken.symbol : position.token0.symbol,
          tokenSymbolOut: isToken1Native ? nativeToken.symbol : position.token1.symbol,
          arbitrary: {
            token_1: position.token0.symbol,
            token_2: position.token1.symbol,
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
    isToken0Native,
    isToken1Native,
    library,
    nativeToken.symbol,
    nftManagerContract,
    notify,
    position.chain.id,
    position.dex.id,
    position.id,
    position.token0,
    position.token1,
    setClaimTx,
    setClaiming,
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
              tokenImage={isToken0Native ? nativeToken.logo : position.token0.logo}
              dexImage={position.chain.logo}
              tokenAmount={feeInfo.amount0}
              tokenSymbol={isToken0Native ? nativeToken.symbol : position.token0.symbol}
              tokenUsdValue={feeInfo.value0}
            />
            <ClaimInfoRow
              tokenImage={isToken1Native ? nativeToken.logo : position.token1.logo}
              dexImage={position.chain.logo}
              tokenAmount={feeInfo.amount1}
              tokenSymbol={isToken1Native ? nativeToken.symbol : position.token1.symbol}
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
