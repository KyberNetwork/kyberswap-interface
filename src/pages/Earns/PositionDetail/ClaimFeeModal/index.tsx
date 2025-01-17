import { WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import Row from 'components/Row'
import NonfungiblePositionManagerABI from 'constants/abis/uniswapv3NftManagerContract.json'
import { ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import { useWeb3React } from 'hooks'
import { useSigningContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import { ParsedPosition } from '..'
import { NFT_MANAGER_CONTRACT } from '../../constants'
import { ClaimInfo, ClaimInfoRow, ClaimInfoWrapper, ModalHeader, Wrapper, X } from './styles'

const isNativeToken = (tokenAddress: string, chainId: keyof typeof WETH) =>
  tokenAddress.toLowerCase() === ETHER_ADDRESS.toLowerCase() ||
  (WETH[chainId] && tokenAddress.toLowerCase() === WETH[chainId].address)

export default function ClaimFeeModal({
  claiming,
  setClaiming,
  setClaimTx,
  position,
  onClose,
}: {
  claiming: boolean
  setClaiming: (claiming: boolean) => void
  setClaimTx: (tx: string | null) => void
  position: ParsedPosition
  onClose: () => void
}) {
  const { library, account } = useWeb3React()
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const addTransactionWithType = useTransactionAdder()

  const nftManagerContractOfDex = NFT_MANAGER_CONTRACT[position.dex as keyof typeof NFT_MANAGER_CONTRACT]
  const nftManagerContract =
    typeof nftManagerContractOfDex === 'string'
      ? nftManagerContractOfDex
      : nftManagerContractOfDex[position.chainId as keyof typeof nftManagerContractOfDex]

  const contract = useSigningContract(nftManagerContract, NonfungiblePositionManagerABI)

  const handleCollectFees = async () => {
    if (!library || !contract) return
    setClaiming(true)

    const tokenId = position.id
    const recipient = account
    const maxUnit = '0x' + (2n ** 128n - 1n).toString(16)
    const calldatas = []

    try {
      const isToken0Native = isNativeToken(position.token0Address, position.chainId as keyof typeof WETH)
      const isToken1Native = isNativeToken(position.token1Address, position.chainId as keyof typeof WETH)
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
        const ethAmount = isToken0Native ? position.token0UnclaimedBalance : position.token1UnclaimedBalance
        const token = isToken0Native ? position.token1Address : position.token0Address
        const tokenAmount = isToken0Native ? position.token1UnclaimedBalance : position.token0UnclaimedBalance

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
        type: TRANSACTION_TYPE.CLAIM,
        hash: tx.hash,
      })
      setClaimTx(tx.hash)
      onClose()
    } catch (error) {
      console.error(error)
      setClaiming(false)
    }
  }

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
                {formatDisplayNumber(position.totalUnclaimedFee, { style: 'currency', significantDigits: 4 })}
              </Text>
            </Flex>
            <ClaimInfoRow
              tokenImage={position.token0Logo}
              dexImage={position.chainLogo}
              tokenAmount={position.token0UnclaimedAmount}
              tokenSymbol={position.token0Symbol}
              tokenUsdValue={position.token0UnclaimedValue}
            />
            <ClaimInfoRow
              tokenImage={position.token1Logo}
              dexImage={position.chainLogo}
              tokenAmount={position.token1UnclaimedAmount}
              tokenSymbol={position.token1Symbol}
              tokenUsdValue={position.token1UnclaimedValue}
            />
          </ClaimInfo>
        </ClaimInfoWrapper>
        <Row gap="16px" flexDirection={upToExtraSmall ? 'column' : 'row'}>
          <ButtonOutlined onClick={onClose}>{t`Cancel`}</ButtonOutlined>
          <ButtonPrimary gap="4px" disabled={claiming} altDisabledStyle onClick={handleCollectFees}>
            {claiming && <Loader stroke={theme.text} />}
            {claiming ? t`Claiming` : t`Claim`}
          </ButtonPrimary>
        </Row>
      </Wrapper>
    </Modal>
  )
}
