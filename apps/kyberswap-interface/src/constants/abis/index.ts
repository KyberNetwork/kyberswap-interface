// Centralized typed re-exports of every ABI used by the app. Importing from
// here gives consumers a viem `Abi`-typed value with no per-call-site cast.
// The four Hardhat-artifact JSONs keep their `{ abi, ... }` shape for callers
// that access `.abi` directly.
import { DMMPool } from '@kyberswap/ks-sdk-classic'

// Hardhat-artifact JSONs (`{ abi: [...] }`). Re-exported as the full object so
// callers that access `.abi` keep working.
import iUniswapV2PairRaw from 'constants/abis/IUniswapV2PairABI.json'
// Flat ABI arrays
import argentWalletDetectorRaw from 'constants/abis/argent-wallet-detector.json'
import claimRewardAbiRaw from 'constants/abis/claim-reward.json'
import dmmFactoryRaw from 'constants/abis/dmm-factory.json'
import dmmRouterDynamicFeeRaw from 'constants/abis/dmm-router-dynamic-fee.json'
import dmmRouterStaticFeeRaw from 'constants/abis/dmm-router-static-fee.json'
import algebraNftManagerRaw from 'constants/abis/earn/algebraNftManagerContract.json'
import pancakeInfinityClNftManagerRaw from 'constants/abis/earn/pancakeInfinityClNftManagerContract.json'
import univ3NftManagerRaw from 'constants/abis/earn/uniswapv3NftManagerContract.json'
import univ4NftManagerRaw from 'constants/abis/earn/uniswapv4NftManagerContract.json'
import univ4StateViewRaw from 'constants/abis/earn/uniswapv4StateViewAbi.json'
import eip2612Raw from 'constants/abis/eip2612.json'
import ensPublicResolverRaw from 'constants/abis/ens-public-resolver.json'
import ensRegistrarRaw from 'constants/abis/ens-registrar.json'
import erc20Raw from 'constants/abis/erc20.json'
import erc20Bytes32Raw from 'constants/abis/erc20_bytes32.json'
import ksFactoryRaw from 'constants/abis/ks-factory.json'
import ksRouterStaticFeeRaw from 'constants/abis/ks-router-static-fee.json'
import daoRaw from 'constants/abis/kyberdao/dao.json'
import kyberdaoMigrateRaw from 'constants/abis/kyberdao/migrate.json'
import rewardDistributorRaw from 'constants/abis/kyberdao/reward_distributor.json'
import stakingRaw from 'constants/abis/kyberdao/staking.json'
import limitOrderRaw from 'constants/abis/limit_order.json'
import merklDistributorRaw from 'constants/abis/merkl-distributor.json'
import nftPositionManagerRaw from 'constants/abis/v2/ProAmmNFTPositionManager.json'
import proAmmPoolStateRaw from 'constants/abis/v2/ProAmmPoolState.json'
import tickReaderRaw from 'constants/abis/v2/ProAmmTickReader.json'
import prommFarmRaw from 'constants/abis/v2/farm.json'
import farmV21Raw from 'constants/abis/v2/farmv2.1.json'
import farmV2Raw from 'constants/abis/v2/farmv2.json'
import wethRaw from 'constants/abis/weth.json'
import zapStaticFeeRaw from 'constants/abis/zap-static-fee.json'
import zapRaw from 'constants/abis/zap.json'
import type { Abi } from 'utils/viem'

// --- ERC20 ---
export const ERC20_ABI = erc20Raw as Abi
export const ERC20_BYTES32_ABI = erc20Bytes32Raw as Abi

// --- Argent wallet detector ---
export const ARGENT_WALLET_DETECTOR_ABI = argentWalletDetectorRaw as Abi
export const ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS = '0xeca4B0bDBf7c55E9b7925919d03CbF8Dc82537E8'

// --- Classic DMM ---
export const DMM_POOL_ABI = DMMPool.abi as Abi
export const FACTORY_ABI = dmmFactoryRaw as Abi
export const ROUTER_DYNAMIC_FEE_ABI = dmmRouterDynamicFeeRaw as Abi
export const ROUTER_STATIC_FEE_ABI = dmmRouterStaticFeeRaw as Abi
export const KS_STATIC_FEE_FACTORY_ABI = ksFactoryRaw as Abi
export const KS_ROUTER_STATIC_FEE_ABI = ksRouterStaticFeeRaw as Abi
export const ZAP_ABI = zapRaw as Abi
export const ZAP_STATIC_FEE_ABI = zapStaticFeeRaw as Abi

// --- Earn / DEX NFT position managers ---
export const AlgebraNftManagerABI = algebraNftManagerRaw as Abi
export const PancakeInfinityClNftManagerABI = pancakeInfinityClNftManagerRaw as Abi
export const Univ3NftManagerABI = univ3NftManagerRaw as Abi
export const Univ4NftManagerABI = univ4NftManagerRaw as Abi
export const StateViewABI = univ4StateViewRaw as Abi

// --- KyberDAO ---
export const DaoABI = daoRaw as Abi
export const MigrateABI = kyberdaoMigrateRaw as Abi
export const RewardDistributorABI = rewardDistributorRaw as Abi
export const StakingABI = stakingRaw as Abi

// --- Elastic / Earn farms ---
export const PROMM_FARM_ABI = prommFarmRaw as Abi
export const farmV1ABI = PROMM_FARM_ABI
export const FarmV2ABI = farmV2Raw as Abi
export const FarmV21ABI = farmV21Raw as Abi

// --- Misc ---
export const CLAIM_REWARD_ABI = claimRewardAbiRaw as Abi
export const EIP_2612 = eip2612Raw as Abi
export const ENS_ABI = ensRegistrarRaw as Abi
export const ENS_PUBLIC_RESOLVER_ABI = ensPublicResolverRaw as Abi
export const LIMIT_ORDER_ABI = limitOrderRaw as Abi
export const MERKL_DISTRIBUTOR_ABI = merklDistributorRaw as Abi
export const WETH_ABI = wethRaw as Abi

// --- Hardhat-artifact JSONs (keep `.abi` access) ---
export const IUniswapV2PairABI = iUniswapV2PairRaw as { abi: Abi; [k: string]: unknown }
export const NFTPositionManagerABI = nftPositionManagerRaw as { abi: Abi; [k: string]: unknown }
export const ProAmmPoolStateABI = proAmmPoolStateRaw as { abi: Abi; [k: string]: unknown }
export const TickReaderABI = tickReaderRaw as { abi: Abi; [k: string]: unknown }
