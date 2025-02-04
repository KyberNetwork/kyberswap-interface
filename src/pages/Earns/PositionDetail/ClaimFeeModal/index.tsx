import { WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import ethereumIcon from 'assets/networks/ethereum.svg'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import Row from 'components/Row'
import NonfungiblePositionManagerABI from 'constants/abis/uniswapv3NftManagerContract.json'
import { ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import { useWeb3React } from 'hooks'
import { useSigningContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import { ParsedPosition } from '..'
import { NFT_MANAGER_CONTRACT } from '../../constants'
import { FeeInfo } from '../LeftSection'
import { ClaimInfo, ClaimInfoRow, ClaimInfoWrapper, ModalHeader, Wrapper, X } from './styles'

export const isNativeToken = (tokenAddress: string, chainId: keyof typeof WETH) =>
  tokenAddress.toLowerCase() === ETHER_ADDRESS.toLowerCase() ||
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
  position: ParsedPosition
  feeInfo: FeeInfo
  onClose: () => void
}) {
  const { library, account, chainId } = useWeb3React()
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const addTransactionWithType = useTransactionAdder()
  const { changeNetwork } = useChangeNetwork()

  const [autoClaim, setAutoClaim] = useState(false)

  const nftManagerContractOfDex = NFT_MANAGER_CONTRACT[position.dex as keyof typeof NFT_MANAGER_CONTRACT]
  const nftManagerContract =
    typeof nftManagerContractOfDex === 'string'
      ? nftManagerContractOfDex
      : nftManagerContractOfDex[position.chainId as keyof typeof nftManagerContractOfDex]

  const contract = useSigningContract(nftManagerContract, NonfungiblePositionManagerABI)

  const isToken0Native = isNativeToken(position.token0Address, position.chainId as keyof typeof WETH)
  const isToken1Native = isNativeToken(position.token1Address, position.chainId as keyof typeof WETH)

  const handleCollectFees = useCallback(async () => {
    if (!library || !contract) return
    const accounts = await library.listAccounts()
    if (chainId !== position.chainId || !accounts.length) {
      if (chainId !== position.chainId) changeNetwork(position.chainId)
      setAutoClaim(true)
      return
    }
    setClaiming(true)

    const tokenId = position.id
    const recipient = account
    const maxUnit = '0x' + (2n ** 128n - 1n).toString(16)
    const calldatas = []

    try {
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
        const token = isToken0Native ? position.token1Address : position.token0Address
        const tokenAmount = isToken0Native ? feeInfo.balance1 : feeInfo.balance0

        // Encode the unwrapWETH9 call
        const unwrapWETH9CallData = contract.interface.encodeFunctionData('unwrapWETH9', [ethAmount, recipient])

        // Encode the sweepToken call
        const sweepTokenCallData = contract.interface.encodeFunctionData('sweepToken', [token, tokenAmount, recipient])

        calldatas.push(unwrapWETH9CallData)
        calldatas.push(sweepTokenCallData)
      }

      // Combine calls in multicall
      const multicallData = contract.interface.encodeFunctionData('multicall', [calldatas])

      // Send transaction
      const tx = await library.getSigner().sendTransaction({
        to: nftManagerContract,
        data: multicallData,
      })
      addTransactionWithType({
        type: TRANSACTION_TYPE.COLLECT_FEE,
        hash: tx.hash,
        extraInfo: {
          tokenAmountIn: formatDisplayNumber(feeInfo.amount0, { significantDigits: 4 }),
          tokenAmountOut: formatDisplayNumber(feeInfo.amount1, { significantDigits: 4 }),
          tokenAddressIn: position.token0Address,
          tokenAddressOut: position.token1Address,
          tokenSymbolIn: isToken0Native ? 'ETH' : position.token0Symbol,
          tokenSymbolOut: isToken1Native ? 'ETH' : position.token1Symbol,
          arbitrary: {
            token_1: position.token0Symbol,
            token_2: position.token1Symbol,
            token_1_amount: formatDisplayNumber(feeInfo.amount0, { significantDigits: 4 }),
            token_2_amount: formatDisplayNumber(feeInfo.amount1, { significantDigits: 4 }),
          },
        },
      })
      setClaimTx(tx.hash)
      onClose()
    } catch (error) {
      console.error(error)
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
    nftManagerContract,
    onClose,
    position.chainId,
    position.id,
    position.token0Address,
    position.token0Symbol,
    position.token1Address,
    position.token1Symbol,
    setClaimTx,
    setClaiming,
  ])

  useEffect(() => {
    if (autoClaim && chainId === position.chainId) {
      handleCollectFees()
      setAutoClaim(false)
    }
  }, [chainId, position.chainId, handleCollectFees, autoClaim])

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
              tokenImage={isToken0Native ? ethereumIcon : position.token0Logo}
              dexImage={position.chainLogo}
              tokenAmount={feeInfo.amount0}
              tokenSymbol={isToken0Native ? 'ETH' : position.token0Symbol}
              tokenUsdValue={feeInfo.value0}
            />
            <ClaimInfoRow
              tokenImage={isToken1Native ? ethereumIcon : position.token1Logo}
              dexImage={position.chainLogo}
              tokenAmount={feeInfo.amount1}
              tokenSymbol={isToken1Native ? 'ETH' : position.token1Symbol}
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
