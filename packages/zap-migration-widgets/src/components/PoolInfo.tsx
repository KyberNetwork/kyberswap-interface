import { Skeleton } from "@kyber/ui/skeleton";
import { DexInfos, NetworkInfo } from "../constants";
import { ChainId, Pool } from "../schema";
import { Image } from "./Image";

export function PoolInfo({
  chainId,
  pool,
}: {
  pool: "loading" | Pool;
  chainId: ChainId;
}) {
  if (pool === "loading")
    return (
      <div className="ui-h-[62px]">
        <Skeleton className="w-[150px] h-6" />
        <Skeleton className="w-[120px] h-5 mt-3" />
      </div>
    );
  return (
    <>
      <div className="flex gap-1 items-center">
        <div className="flex items-end">
          <Image
            src={pool.token0.logo || ""}
            alt={pool.token0.symbol}
            className="w-6 h-6 z-0"
          />
          <Image
            src={pool.token1.logo || ""}
            alt={pool.token1.symbol}
            className="w-6 h-6 -ml-2 z-10"
          />
          <Image
            src={NetworkInfo[chainId].logo}
            alt={NetworkInfo[chainId].name}
            className="w-3 h-3 -ml-1.5 z-20"
          />
        </div>
        <div className="text-xl self-center">
          {pool.token0.symbol}/{pool.token1.symbol}
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1">
        <Image
          src={DexInfos[pool.dex].icon}
          alt={DexInfos[pool.dex].name}
          className="w-4 h-4"
        />
        <div className="text-sm opacity-70">{DexInfos[pool.dex].name}</div>
        <div className="rounded-xl bg-layer2 px-2 py-1 text-xs">
          Fee {pool.fee}%
        </div>
      </div>
    </>
  );
}
