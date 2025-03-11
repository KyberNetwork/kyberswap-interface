import { Skeleton } from "@kyber/ui/skeleton";
import { DexInfos, NetworkInfo } from "../constants";
import { ChainId, Pool, Position } from "../schema";
import { Image } from "./Image";
import { usePoolsStore } from "../stores/usePoolsStore";

export function PoolInfo({
  chainId,
  position,
  pool,
}: {
  pool: "loading" | Pool;
  position: "loading" | Position | null;
  chainId: ChainId;
}) {
  const { theme } = usePoolsStore();

  if (pool === "loading" || position === "loading")
    return (
      <div className="ui-h-[62px]">
        <Skeleton className="w-[150px] h-6" />
        <Skeleton className="w-[120px] h-5 mt-3" />
      </div>
    );

  const isOutOfRange = position
    ? pool.tick < position.tickLower || pool.tick > position.tickUpper
    : false;

  const dexName =
    typeof DexInfos[pool.dex].name === "string"
      ? (DexInfos[pool.dex].name as string)
      : DexInfos[pool.dex].name[chainId];

  return (
    <>
      <div className="flex gap-1 items-center">
        <div className="flex items-end">
          <Image
            src={pool.token0.logo || ""}
            alt={pool.token0.symbol}
            className="w-6 h-6 z-0 rounded-full"
          />
          <Image
            src={pool.token1.logo || ""}
            alt={pool.token1.symbol}
            className="w-6 h-6 -ml-2 z-10 rounded-full"
          />
          <Image
            src={NetworkInfo[chainId].logo}
            alt={NetworkInfo[chainId].name}
            className="w-3 h-3 -ml-1.5 z-20 rounded-full"
          />
        </div>
        <div className="text-xl self-center">
          {pool.token0.symbol}/{pool.token1.symbol}
        </div>
        <div className="text-lg"> {position && <div>#{position.id}</div>}</div>
      </div>

      <div className="mt-2.5 flex items-center gap-1">
        <Image
          src={DexInfos[pool.dex].icon}
          alt={dexName}
          className="w-4 h-4 rounded-full"
        />
        <div className="text-sm opacity-70">{dexName}</div>
        <div className="rounded-xl bg-layer2 px-2 py-1 text-xs">
          Fee {pool.fee}%
        </div>
        {position && (
          <div
            className={`rounded-full text-xs px-2 py-1 font-normal ${
              isOutOfRange ? "text-warning" : "text-accent"
            }`}
            style={{
              background: `${isOutOfRange ? theme.warning : theme.accent}33`,
            }}
          >
            {isOutOfRange ? "● Out of range" : "● In range"}
          </div>
        )}
      </div>
    </>
  );
}
