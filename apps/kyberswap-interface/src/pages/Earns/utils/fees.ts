import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { defaultAbiCoder as abiEncoder, keccak256, solidityPack } from 'ethers/lib/utils'

import StateViewABI from 'constants/abis/earn/uniswapv4StateViewAbi.json'
import { CoreProtocol, EarnDex, UNISWAPV4_STATEVIEW_CONTRACT } from 'pages/Earns/constants'
import { ParsedPosition } from 'pages/Earns/types'
import { getNftManagerContract, getNftManagerContractAddress, isForkFrom } from 'pages/Earns/utils'
import { getReadingContractWithCustomChain } from 'utils/getContract'

export const getUnclaimedFeesInfo = async (position: ParsedPosition) => {
  const { tokenId, dex, chain, token0, token1 } = position
  const chainId = chain.id
  const isUniv4 = isForkFrom(dex.id, CoreProtocol.UniswapV4)

  const { balance0, balance1 } = isUniv4
    ? await getUniv4UnclaimedFees({
        tokenId,
        dex: dex.id,
        chainId,
        poolAddress: position.pool.address,
      })
    : await getUniv3UnclaimedFees({
        tokenId,
        dex: dex.id,
        chainId,
      })

  const amount0 = CurrencyAmount.fromRawAmount(new Token(chainId, token0.address, token0.decimals), balance0).toExact()
  const amount1 = CurrencyAmount.fromRawAmount(new Token(chainId, token1.address, token1.decimals), balance1).toExact()

  const token0Price = token0.price
  const token1Price = token1.price

  return {
    balance0,
    balance1,
    amount0,
    amount1,
    value0: parseFloat(amount0) * token0Price,
    value1: parseFloat(amount1) * token1Price,
    totalValue: parseFloat(amount0) * token0Price + parseFloat(amount1) * token1Price,
  }
}

const getUniv3UnclaimedFees = async ({ tokenId, dex, chainId }: { tokenId: string; dex: EarnDex; chainId: number }) => {
  const contract = getNftManagerContract(dex, chainId)
  if (!contract) return { balance0: 0, balance1: 0 }

  const owner = await contract.ownerOf(tokenId)

  const maxUnit = '0x' + (2n ** 128n - 1n).toString(16)
  const results = await contract.callStatic.collect(
    {
      tokenId,
      recipient: owner,
      amount0Max: maxUnit,
      amount1Max: maxUnit,
    },
    { from: owner },
  )
  const balance0 = results.amount0.toString()
  const balance1 = results.amount1.toString()

  return { balance0, balance1 }
}

const getUniv4UnclaimedFees = async ({
  tokenId,
  dex,
  chainId,
  poolAddress,
}: {
  tokenId: number | string
  dex: EarnDex
  chainId: number
  poolAddress: string
}) => {
  const defaultBalance = { balance0: 0, balance1: 0 }

  try {
    const nftPosManagerContract = getNftManagerContract(dex, chainId)
    if (!nftPosManagerContract) return defaultBalance

    const positionInfo = await nftPosManagerContract.positionInfo(tokenId)
    const { tickLower, tickUpper } = decodePositionInfo(BigInt(positionInfo))

    const stateViewAddress = UNISWAPV4_STATEVIEW_CONTRACT[chainId as keyof typeof UNISWAPV4_STATEVIEW_CONTRACT]
    const stateViewContract = getReadingContractWithCustomChain(stateViewAddress, StateViewABI, chainId)
    if (!stateViewContract) return defaultBalance

    const salt = abiEncoder.encode(['uint256'], [tokenId])
    const nftPosManagerAddress = getNftManagerContractAddress(dex, chainId)
    const positionId = keccak256(
      solidityPack(['address', 'int24', 'int24', 'bytes32'], [nftPosManagerAddress, tickLower, tickUpper, salt]),
    )
    const statePositionInfo = await stateViewContract.getPositionInfo(poolAddress, positionId)
    const positionLiquidity = statePositionInfo[0]

    const feeGrowthInsideCurrent = await stateViewContract.getFeeGrowthInside(poolAddress, tickLower, tickUpper)
    const pendingFees0 = positionLiquidity
      .mul(feeGrowthInsideCurrent[0].sub(statePositionInfo.feeGrowthInside0LastX128))
      .shr(128)
    const pendingFees1 = positionLiquidity
      .mul(feeGrowthInsideCurrent[1].sub(statePositionInfo.feeGrowthInside1LastX128))
      .shr(128)

    return {
      balance0: pendingFees0.toString(),
      balance1: pendingFees1.toString(),
    }
  } catch (error) {
    console.log('getUniv4UnclaimedFees error', error)
    return defaultBalance
  }
}

const decodePositionInfo = (positionInfo: string | bigint) => {
  // Convert input to BigInt if it's a hex string
  if (typeof positionInfo === 'string') {
    positionInfo = BigInt(positionInfo)
  }

  // Extract tickLower (bits 8–31), signed 24-bit
  const tickLowerRaw = Number((positionInfo >> 8n) & 0xffffffn)
  const tickLower = tickLowerRaw >= 0x800000 ? tickLowerRaw - 0x1000000 : tickLowerRaw

  // Extract tickUpper (bits 32–55), signed 24-bit
  const tickUpperRaw = Number((positionInfo >> 32n) & 0xffffffn)
  const tickUpper = tickUpperRaw >= 0x800000 ? tickUpperRaw - 0x1000000 : tickUpperRaw

  // Extract top 200 bits (25 bytes) for poolId
  const truncatedPoolIdBigInt = positionInfo >> 56n
  const truncatedPoolIdHex = '0x' + truncatedPoolIdBigInt.toString(16).padStart(50, '0') // 25 bytes = 50 hex chars

  return {
    poolId: truncatedPoolIdHex, // for poolKeys lookup
    tickLower,
    tickUpper,
  }
}
