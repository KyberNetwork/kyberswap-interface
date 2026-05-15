import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import IUniswapV2PairABI from 'constants/abis/IUniswapV2PairABI.json'
import {
  ARGENT_WALLET_DETECTOR_ABI,
  ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS,
} from 'constants/abis/argent-wallet-detector'
import FACTORY_ABI from 'constants/abis/dmm-factory.json'
import ENS_PUBLIC_RESOLVER_ABI from 'constants/abis/ens-public-resolver.json'
import ENS_ABI from 'constants/abis/ens-registrar.json'
import { ERC20_BYTES32_ABI } from 'constants/abis/erc20'
import ERC20_ABI from 'constants/abis/erc20.json'
import KS_STATIC_FEE_FACTORY_ABI from 'constants/abis/ks-factory.json'
import NFTPositionManagerABI from 'constants/abis/v2/ProAmmNFTPositionManager.json'
import PROMM_FARM_ABI from 'constants/abis/v2/farm.json'
import WETH_ABI from 'constants/abis/weth.json'
import ZAP_STATIC_FEE_ABI from 'constants/abis/zap-static-fee.json'
import ZAP_ABI from 'constants/abis/zap.json'
import { MULTICALL_ABI } from 'constants/multicall'
import { NETWORKS_INFO } from 'constants/networks'
import { isAddress } from 'utils'
import { Abi, Address, zeroAddress } from 'utils/viem'

import { useActiveWeb3React } from './index'

// Lightweight contract reference: address + ABI. Multicall hooks
// (useSingleCallResult etc.) only need these two fields, and write paths
// route through `sendEVMTransaction` + `encodeFunctionData` which take the
// ABI directly. Non-React callers should pair this with `readContract` from
// `@wagmi/core`.
export interface ContractRef {
  address: Address
  abi: Abi
}

function buildRef(address: string | undefined, abi: unknown): ContractRef | null {
  if (!address) return null
  if (!isAddress(ChainId.MAINNET, address) || address === zeroAddress) return null
  return { address: address as Address, abi: abi as Abi }
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
  _customChainId?: ChainId,
): ContractRef | null {
  return useMemo(() => buildRef(address, abi), [address, abi])
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
  return useReadingContract(WETH[chainId]?.address, WETH_ABI)
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
