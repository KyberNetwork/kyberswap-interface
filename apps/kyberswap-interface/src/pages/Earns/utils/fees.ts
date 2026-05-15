import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { readContract } from '@wagmi/core'

import { wagmiConfig } from 'components/Web3Provider'
import { StateViewABI } from 'constants/abis'
import { ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import { ClaimInfo } from 'pages/Earns/components/ClaimModal'
import { EARN_CHAINS, EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import { ParsedPosition } from 'pages/Earns/types'
import { getNftManagerContractAddress } from 'pages/Earns/utils'
import {
  type Address,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  keccak256,
  parseAbiParameters,
} from 'utils/viem'

export const getUnclaimedFeesInfo = async (position: ParsedPosition) => {
  const { tokenId, dex, chain, token0, token1 } = position
  const chainId = chain.id
  const isUniv4 = EARN_DEXES[dex.id].isForkFrom === CoreProtocol.UniswapV4

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

const getUniv3UnclaimedFees = async ({
  tokenId,
  dex,
  chainId,
}: {
  tokenId: string
  dex: Exchange
  chainId: number
}) => {
  const nftManagerAddress = getNftManagerContractAddress(dex, chainId)
  const nftManagerAbi = EARN_DEXES[dex].nftManagerContractAbi
  if (!nftManagerAddress || !nftManagerAbi) return { balance0: 0, balance1: 0 }

  const owner = (await readContract(wagmiConfig, {
    address: nftManagerAddress as Address,
    abi: nftManagerAbi,
    functionName: 'ownerOf',
    args: [BigInt(tokenId)],
    chainId,
  })) as Address

  const maxUint128 = 2n ** 128n - 1n
  const results = (await readContract(wagmiConfig, {
    address: nftManagerAddress as Address,
    abi: nftManagerAbi,
    functionName: 'collect',
    args: [
      {
        tokenId: BigInt(tokenId),
        recipient: owner,
        amount0Max: maxUint128,
        amount1Max: maxUint128,
      },
    ],
    account: owner,
    chainId,
  })) as readonly [bigint, bigint]
  const balance0 = results[0].toString()
  const balance1 = results[1].toString()

  return { balance0, balance1 }
}

const getUniv4UnclaimedFees = async ({
  tokenId,
  dex,
  chainId,
  poolAddress,
}: {
  tokenId: number | string
  dex: Exchange
  chainId: number
  poolAddress: string
}) => {
  const defaultBalance = { balance0: 0, balance1: 0 }

  try {
    const nftPosManagerAddress = getNftManagerContractAddress(dex, chainId)
    const nftPosManagerAbi = EARN_DEXES[dex].nftManagerContractAbi
    if (!nftPosManagerAddress || !nftPosManagerAbi) return defaultBalance

    const positionInfo = (await readContract(wagmiConfig, {
      address: nftPosManagerAddress as Address,
      abi: nftPosManagerAbi,
      functionName: 'positionInfo',
      args: [BigInt(tokenId)],
      chainId,
    })) as bigint
    const { tickLower, tickUpper } = decodePositionInfo(positionInfo)

    const stateViewAddress = EARN_CHAINS[chainId as keyof typeof EARN_CHAINS].univ4StateViewContract
    if (!stateViewAddress) return defaultBalance

    const salt = encodeAbiParameters(parseAbiParameters('uint256'), [BigInt(tokenId)])
    const positionId = keccak256(
      encodePacked(
        ['address', 'int24', 'int24', 'bytes32'],
        [nftPosManagerAddress as `0x${string}`, tickLower, tickUpper, salt],
      ),
    )
    const statePositionInfo = (await readContract(wagmiConfig, {
      address: stateViewAddress as Address,
      abi: StateViewABI,
      functionName: 'getPositionInfo',
      args: [poolAddress as `0x${string}`, positionId],
      chainId,
    })) as readonly [bigint, bigint, bigint]
    const positionLiquidity = statePositionInfo[0]
    const feeGrowthInside0LastX128 = statePositionInfo[1]
    const feeGrowthInside1LastX128 = statePositionInfo[2]

    const feeGrowthInsideCurrent = (await readContract(wagmiConfig, {
      address: stateViewAddress as Address,
      abi: StateViewABI,
      functionName: 'getFeeGrowthInside',
      args: [poolAddress as `0x${string}`, tickLower, tickUpper],
      chainId,
    })) as readonly [bigint, bigint]
    // V4's fee-growth accumulators are uint256 and wrap on overflow, so the
    // delta against the position's snapshot must be computed modulo 2^256.
    // Native bigint subtraction is signed and would produce a negative number
    // after a wrap; mask back into the unsigned range.
    const TWO_POW_256 = 1n << 256n
    const delta0 = (feeGrowthInsideCurrent[0] - feeGrowthInside0LastX128 + TWO_POW_256) % TWO_POW_256
    const delta1 = (feeGrowthInsideCurrent[1] - feeGrowthInside1LastX128 + TWO_POW_256) % TWO_POW_256
    const pendingFees0 = (positionLiquidity * delta0) >> 128n
    const pendingFees1 = (positionLiquidity * delta1) >> 128n

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

export const getUniv3CollectCallData = async ({
  claimInfo,
  recipient,
}: {
  claimInfo: ClaimInfo | null
  recipient?: string
}) => {
  if (!claimInfo || !claimInfo.dex || !recipient) return

  const nftManagerAddress = getNftManagerContractAddress(claimInfo.dex as Exchange, claimInfo.chainId)
  const nftAbi = EARN_DEXES[claimInfo.dex as Exchange].nftManagerContractAbi
  if (!nftManagerAddress || !nftAbi) return

  const tokenId = claimInfo.nftId
  const maxUint128 = 2n ** 128n - 1n
  const calldatas = []

  const token0 = claimInfo.tokens[0]
  const token1 = claimInfo.tokens[1]

  const owner = (await readContract(wagmiConfig, {
    address: nftManagerAddress as Address,
    abi: nftAbi,
    functionName: 'ownerOf',
    args: [BigInt(tokenId)],
    chainId: claimInfo.chainId,
  })) as Address
  const involvesETH = token0.isNative || token1.isNative
  const collectParams = {
    tokenId: BigInt(tokenId),
    recipient: involvesETH ? ZERO_ADDRESS : recipient,
    amount0Max: maxUint128,
    amount1Max: maxUint128,
  }
  const collectCallData = encodeFunctionData({ abi: nftAbi, functionName: 'collect', args: [collectParams] })
  calldatas.push(collectCallData)

  if (involvesETH) {
    const token = token0.isNative ? token1.address : token0.address

    const unwrapWNativeTokenFuncName = EARN_DEXES[claimInfo.dex].unwrapWNativeTokenFuncName
    if (!unwrapWNativeTokenFuncName) return
    const unwrapWETH9CallData = encodeFunctionData({
      abi: nftAbi,
      functionName: unwrapWNativeTokenFuncName,
      args: [0n, recipient],
    })

    // Use 0 as minimum amount for sweepToken to avoid overflow with large balance values
    const sweepTokenCallData = encodeFunctionData({
      abi: nftAbi,
      functionName: 'sweepToken',
      args: [token, 0n, recipient],
    })

    calldatas.push(unwrapWETH9CallData)
    calldatas.push(sweepTokenCallData)
  }

  const multicallData = encodeFunctionData({ abi: nftAbi, functionName: 'multicall', args: [calldatas] })

  return {
    to: owner !== recipient ? owner : nftManagerAddress,
    data: multicallData,
  }
}

export const getUniv4CollectCallData = async ({
  claimInfo,
  recipient,
}: {
  claimInfo: ClaimInfo | null
  recipient?: string
}) => {
  if (!claimInfo || !recipient) return

  const nftManagerAddress = getNftManagerContractAddress(claimInfo.dex as Exchange, claimInfo.chainId)
  const nftAbiForCollect = EARN_DEXES[claimInfo.dex as Exchange].nftManagerContractAbi
  if (!nftManagerAddress || !nftAbiForCollect) return

  const token0 = claimInfo.tokens[0]
  const token1 = claimInfo.tokens[1]
  if (!token0.address || !token1.address) return

  const isToken0Native = token0.address.toLowerCase() === ETHER_ADDRESS.toLowerCase()
  const isToken1Native = token1.address.toLowerCase() === ETHER_ADDRESS.toLowerCase()

  let token0Address: string
  let token1Address: string

  if (isToken0Native || isToken1Native) {
    token0Address = isToken0Native ? ZERO_ADDRESS : token0.address
    token1Address = isToken1Native ? ZERO_ADDRESS : token1.address
  } else {
    // Fallback: sort numerically
    if (token0.address.toLowerCase() < token1.address.toLowerCase()) {
      token0Address = token0.address
      token1Address = token1.address
    } else {
      token0Address = token1.address
      token1Address = token0.address
    }
  }

  // Uniswap V4 action codes
  const DECREASE_LIQUIDITY = 0x01
  const TAKE_PAIR = 0x11

  // Pack the actions: DECREASE_LIQUIDITY then TAKE_PAIR
  const actions = encodePacked(['uint8', 'uint8'], [DECREASE_LIQUIDITY, TAKE_PAIR])

  // Params for DECREASE_LIQUIDITY
  // Format: [tokenId, liquidity, amount0Min, amount1Min, hookData]
  // For collecting fees only: liquidity = 0, amount0Min = 0, amount1Min = 0
  // This allows collecting all fees without decreasing liquidity
  const params0 = encodeAbiParameters(parseAbiParameters('uint256, uint128, uint256, uint256, bytes'), [
    BigInt(claimInfo.nftId),
    0n,
    0n,
    0n,
    '0x',
  ])

  // Params for TAKE_PAIR
  const params1 = encodeAbiParameters(parseAbiParameters('address, address, address'), [
    token0Address as `0x${string}`,
    token1Address as `0x${string}`,
    recipient as `0x${string}`,
  ])

  // Encode unlockData
  const unlockData = encodeAbiParameters(parseAbiParameters('bytes, bytes[]'), [actions, [params0, params1]])

  // Set deadline
  const deadline = Math.floor(Date.now() / 1000) + 5 * 60

  // Encode function data
  const data = encodeFunctionData({
    abi: nftAbiForCollect,
    functionName: 'modifyLiquidities',
    args: [unlockData, BigInt(deadline)],
  })

  return {
    to: nftManagerAddress,
    data,
  }
}
