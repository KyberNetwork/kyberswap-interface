import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import {
  ARGENT_WALLET_DETECTOR_ABI,
  ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS,
  ENS_ABI,
  ENS_PUBLIC_RESOLVER_ABI,
  ERC20_ABI,
  ERC20_BYTES32_ABI,
  FACTORY_ABI,
  IUniswapV2PairABI,
  KS_STATIC_FEE_FACTORY_ABI,
  NFTPositionManagerABI,
  PROMM_FARM_ABI,
  WETH_ABI,
  ZAP_ABI,
  ZAP_STATIC_FEE_ABI,
} from 'constants/abis'
import { MULTICALL_ABI } from 'constants/multicall'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { Abi, Address, isAddress, zeroAddress } from 'utils/viem'

// Lightweight contract reference: address + ABI (+ optional chainId so multicall
// hooks read from the requested chain rather than the connected one). Multicall
// hooks (useSingleCallResult etc.) only need these fields, and write paths
// route through `sendEVMTransaction` + `encodeFunctionData` which take the
// ABI directly. Non-React callers should pair this with `readContract` from
// `@wagmi/core`.
export interface ContractRef {
  address: Address
  abi: Abi
  chainId?: ChainId
}

function buildRef(address: string | undefined, abi: unknown, chainId?: ChainId): ContractRef | null {
  if (!address) return null
  if (!isAddress(address) || address === zeroAddress) return null
  return { address: address as Address, abi: abi as Abi, chainId }
}

// Same shape as `useReadingContract`, but returns `null` when no account is
// connected so call-site conditionals like `if (!contract) return` continue to
// gate write paths on wallet connection.
export function useSigningContract(address: string | undefined, abi: unknown): ContractRef | null {
  const { account } = useActiveWeb3React()
  return useMemo(() => (account ? buildRef(address, abi) : null), [account, address, abi])
}

export function useReadingContract(
  address: string | undefined,
  abi: unknown,
  customChainId?: ChainId,
): ContractRef | null {
  return useMemo(() => buildRef(address, abi, customChainId), [address, abi, customChainId])
}

export function useTokenSigningContract(tokenAddress?: string): ContractRef | null {
  return useSigningContract(tokenAddress, ERC20_ABI)
}

export function useTokenReadingContract(tokenAddress?: string, customChainId?: ChainId): ContractRef | null {
  return useReadingContract(tokenAddress, ERC20_ABI, customChainId)
}

export function useWETHContract(customChainId?: ChainId): ContractRef | null {
  const { chainId: walletChainId } = useActiveWeb3React()
  const chainId = customChainId || walletChainId
  return useReadingContract(WETH[chainId]?.address, WETH_ABI, customChainId)
}

export function useArgentWalletDetectorContract(): ContractRef | null {
  const { chainId } = useActiveWeb3React()
  return useReadingContract(
    chainId === ChainId.MAINNET ? ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS : undefined,
    ARGENT_WALLET_DETECTOR_ABI,
  )
}

export function useENSRegistrarContract(): ContractRef | null {
  const { chainId } = useActiveWeb3React()
  let address: string | undefined

  switch (chainId) {
    case ChainId.MAINNET:
    case ChainId.GÖRLI:
      address = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
      break
  }

  return useReadingContract(address, ENS_ABI)
}

export function useENSResolverContract(address: string | undefined): ContractRef | null {
  return useReadingContract(address, ENS_PUBLIC_RESOLVER_ABI)
}

export function useBytes32TokenContract(tokenAddress?: string): ContractRef | null {
  return useReadingContract(tokenAddress, ERC20_BYTES32_ABI)
}

export function usePairContract(pairAddress?: string): ContractRef | null {
  return useReadingContract(pairAddress, IUniswapV2PairABI.abi)
}

export function useMulticallContract(customChainId?: ChainId): ContractRef | null {
  const { chainId: curChainId } = useActiveWeb3React()
  const chainId = customChainId || curChainId
  return useReadingContract(NETWORKS_INFO[chainId].multicall, MULTICALL_ABI, chainId)
}

export function useOldStaticFeeFactoryContract(): ContractRef | null {
  const { networkInfo } = useActiveWeb3React()
  return useReadingContract(networkInfo.classic.oldStatic?.factory, FACTORY_ABI)
}

export function useStaticFeeFactoryContract(): ContractRef | null {
  const { networkInfo } = useActiveWeb3React()
  return useReadingContract(networkInfo.classic.static.factory, KS_STATIC_FEE_FACTORY_ABI)
}

export function useDynamicFeeFactoryContract(): ContractRef | null {
  const { networkInfo } = useActiveWeb3React()
  return useReadingContract(networkInfo.classic.dynamic?.factory, FACTORY_ABI)
}

export function useZapContract(isStaticFeeContract: boolean, isOldStaticFeeContract: boolean): ContractRef | null {
  const { networkInfo } = useActiveWeb3React()
  return useReadingContract(
    isStaticFeeContract
      ? isOldStaticFeeContract
        ? networkInfo.classic.oldStatic?.zap
        : networkInfo.classic.static.zap
      : networkInfo.classic.dynamic?.zap,
    isStaticFeeContract && !isOldStaticFeeContract ? ZAP_STATIC_FEE_ABI : ZAP_ABI,
  )
}

export function useProMMFarmSigningContract(address: string): ContractRef | null {
  return useSigningContract(address, PROMM_FARM_ABI)
}

export function useProAmmNFTPositionManagerReadingContract(customContract?: string): ContractRef | null {
  const { networkInfo } = useActiveWeb3React()
  return useReadingContract(customContract || networkInfo.elastic.nonfungiblePositionManager, NFTPositionManagerABI.abi)
}
