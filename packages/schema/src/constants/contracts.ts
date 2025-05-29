import { ChainId } from "@/schema/chain";
import { PoolType } from "@/schema/dex";

export const FARMING_CONTRACTS: Partial<
  Record<PoolType, Partial<Record<ChainId, string>>>
> = {
  [PoolType.DEX_PANCAKESWAPV3]: {
    [ChainId.Ethereum]: "0x556B9306565093C855AEA9AE92A594704c2Cd59e",
    [ChainId.Bsc]: "0x556B9306565093C855AEA9AE92A594704c2Cd59e",
    [ChainId.Arbitrum]: "0x5e09ACf80C0296740eC5d6F643005a4ef8DaA694",
    [ChainId.ZkSync]: "0x4c615E78c5fCA1Ad31e4d66eb0D8688d84307463",
    [ChainId.Base]: "0xC6A2Db661D5a5690172d8eB0a7DEA2d3008665A3",
    [ChainId.Linea]: "0x22E2f236065B780FA33EC8C4E58b99ebc8B55c57",
  },
};
