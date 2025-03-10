import { Contract, ContractInterface } from '@ethersproject/contracts'
import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import IUniswapV2PairABI from 'constants/abis/IUniswapV2PairABI.json'
import {
  ARGENT_WALLET_DETECTOR_ABI,
  ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS,
} from 'constants/abis/argent-wallet-detector'
import RouterSwapAction from 'constants/abis/bridge/RouterSwapAction.json'
import swapETHABI from 'constants/abis/bridge/swapETHABI.json'
import FACTORY_ABI from 'constants/abis/dmm-factory.json'
import ENS_PUBLIC_RESOLVER_ABI from 'constants/abis/ens-public-resolver.json'
import ENS_ABI from 'constants/abis/ens-registrar.json'
import { ERC20_BYTES32_ABI } from 'constants/abis/erc20'
import ERC20_ABI from 'constants/abis/erc20.json'
import KS_STATIC_FEE_FACTORY_ABI from 'constants/abis/ks-factory.json'
import NFTPositionManagerABI from 'constants/abis/v2/ProAmmNFTPositionManager.json'
import TickReaderABI from 'constants/abis/v2/ProAmmTickReader.json'
import PROMM_FARM_ABI from 'constants/abis/v2/farm.json'
import WETH_ABI from 'constants/abis/weth.json'
import ZAP_STATIC_FEE_ABI from 'constants/abis/zap-static-fee.json'
import ZAP_ABI from 'constants/abis/zap.json'
import { MULTICALL_ABI } from 'constants/multicall'
import { NETWORKS_INFO } from 'constants/networks'
import { useWeb3React } from 'hooks'
import { useKyberSwapConfig } from 'state/application/hooks'
import { getReadingContract, getSigningContract } from 'utils/getContract'

import { useActiveWeb3React } from './index'

// returns null on errors
export function useSigningContract(address: string | undefined, ABI: ContractInterface): Contract | null {
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()

  const lib = useMemo(() => (account ? library : null), [account, library])

  return useMemo(() => {
    if (!address || !ABI || !lib) return null
    try {
      return account ? getSigningContract(address, ABI, lib, account) : null
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [address, ABI, lib, account])
}

export function useReadingContract(
  address: string | undefined,
  ABI: ContractInterface,
  customChainId?: ChainId,
): Contract | null {
  const { chainId: curChainId } = useActiveWeb3React()
  const chainId = customChainId || curChainId
  const { readProvider } = useKyberSwapConfig(chainId)

  return useMemo(() => {
    if (!address || !readProvider) return null
    try {
      return getReadingContract(address, ABI, readProvider)
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [address, ABI, readProvider])
}

// returns null on errors
export function useMultipleContracts(
  addresses: string[] | undefined,
  ABI: ContractInterface,
  withSignerIfPossible = true,
): {
  [key: string]: Contract
} | null {
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { readProvider } = useKyberSwapConfig()

  return useMemo(() => {
    const lib = withSignerIfPossible ? library : readProvider

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0 || !ABI || !lib) return null

    const result: {
      [key: string]: Contract
    } = {}

    try {
      addresses.forEach(address => {
        if (address) {
          result[address] = withSignerIfPossible
            ? getSigningContract(address, ABI, lib as any, withSignerIfPossible && account ? account : undefined)
            : getReadingContract(address, ABI, lib)
        }
      })

      if (Object.keys(result).length > 0) {
        return result
      }

      return null
    } catch (error) {
      console.error('Failed to get contract', error)

      return null
    }
  }, [addresses, ABI, library, withSignerIfPossible, account, readProvider])
}

export function useTokenSigningContract(tokenAddress?: string): Contract | null {
  return useSigningContract(tokenAddress, ERC20_ABI)
}

export function useTokenReadingContract(tokenAddress?: string, customChainId?: ChainId): Contract | null {
  return useReadingContract(tokenAddress, ERC20_ABI, customChainId)
}

export function useWETHContract(customChainId?: ChainId): Contract | null {
  const { chainId: walletChainId, account } = useActiveWeb3React()
  const chainId = customChainId || walletChainId
  const signContract = useSigningContract(WETH[chainId].address, WETH_ABI)
  const readContract = useReadingContract(WETH[chainId].address, WETH_ABI)

  return account ? signContract : readContract
}

export function useArgentWalletDetectorContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useReadingContract(
    chainId === ChainId.MAINNET ? ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS : undefined,
    ARGENT_WALLET_DETECTOR_ABI,
  )
}

export function useENSRegistrarContract(): Contract | null {
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

export function useENSResolverContract(address: string | undefined): Contract | null {
  return useReadingContract(address, ENS_PUBLIC_RESOLVER_ABI)
}

export function useBytes32TokenContract(tokenAddress?: string): Contract | null {
  return useReadingContract(tokenAddress, ERC20_BYTES32_ABI)
}

export function usePairContract(pairAddress?: string): Contract | null {
  return useReadingContract(pairAddress, IUniswapV2PairABI.abi)
}

export function useMulticallContract(customChainId?: ChainId): Contract | null {
  const { chainId: curChainId } = useActiveWeb3React()
  const chainId = customChainId || curChainId
  return useReadingContract(NETWORKS_INFO[chainId].multicall, MULTICALL_ABI, chainId)
}

export function useOldStaticFeeFactoryContract(): Contract | null {
  const { networkInfo } = useActiveWeb3React()

  return useReadingContract(networkInfo.classic.oldStatic?.factory, FACTORY_ABI)
}
export function useStaticFeeFactoryContract(): Contract | null {
  const { networkInfo } = useActiveWeb3React()

  return useReadingContract(networkInfo.classic.static.factory, KS_STATIC_FEE_FACTORY_ABI)
}
export function useDynamicFeeFactoryContract(): Contract | null {
  const { networkInfo } = useActiveWeb3React()

  return useReadingContract(networkInfo.classic.dynamic?.factory, FACTORY_ABI)
}

export function useZapContract(isStaticFeeContract: boolean, isOldStaticFeeContract: boolean): Contract | null {
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

export function useProMMFarmSigningContract(address: string): Contract | null {
  return useSigningContract(address, PROMM_FARM_ABI)
}

export function useProMMFarmReadingContract(address: string): Contract | null {
  return useReadingContract(address, PROMM_FARM_ABI)
}

export function useProAmmNFTPositionManagerReadingContract(customContract?: string): Contract | null {
  const { networkInfo } = useActiveWeb3React()
  return useReadingContract(customContract || networkInfo.elastic.nonfungiblePositionManager, NFTPositionManagerABI.abi)
}

export function useProAmmTickReader(): Contract | null {
  const { networkInfo } = useActiveWeb3React()
  return useReadingContract(networkInfo.elastic.tickReader, TickReaderABI.abi)
}

// bridge
export function useSwapETHContract(tokenAddress?: string): Contract | null {
  return useSigningContract(tokenAddress, swapETHABI)
}

export function useBridgeContract(routerToken?: any): Contract | null {
  return useSigningContract(routerToken ? routerToken : undefined, RouterSwapAction)
}
