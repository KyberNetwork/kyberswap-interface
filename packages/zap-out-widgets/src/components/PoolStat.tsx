import { PATHS } from "@/constants";
import { formatAprNumber, formatDisplayNumber } from "@kyber/utils/number";
import { cn } from "@kyber/utils/tailwind-helpers";
import { useEffect, useState } from "react";
import { useZapOutContext } from "@/stores";
import { PoolType, Univ2PoolType } from "@/schema";
import { MouseoverTooltip } from "@kyber/ui";
import { Skeleton } from "@kyber/ui";
import FarmingIcon from "@/assets/svg/kem.svg";

interface PoolInfo {
  tvl: number;
  volume24h: number;
  fees24h: number;
  apr24h: number;
  kemApr24h: number;
  kemEGApr: number;
  kemLMApr: number;
}

export default function PoolStat({
  chainId,
  poolAddress,
  poolType,
  positionId,
}: {
  chainId: number;
  poolAddress: string;
  poolType: PoolType;
  positionId?: string;
}) {
  const { position, pool } = useZapOutContext((s) => s);
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);

  const initializing = pool === "loading";

  const isUniv2 = Univ2PoolType.safeParse(poolType).success;
  const poolShare =
    position === "loading" || !isUniv2 || !("totalSupply" in position)
      ? null
      : Number(
          (BigInt(position.liquidity) * 10000n) / BigInt(position.totalSupply)
        ) / 100;

  const poolApr = (poolInfo?.apr24h || 0) + (poolInfo?.kemApr24h || 0);

  const isFarming = poolType === PoolType.DEX_UNISWAP_V4_FAIRFLOW; // TODO: change this logic

  useEffect(() => {
    const handleFetchPoolInfo = () => {
      fetch(
        `${PATHS.ZAP_EARN_API}/v1/pools?chainId=${chainId}&address=${poolAddress}&protocol=${poolType}`
      )
        .then((res) => res.json())
        .then(
          (data) => data?.data?.poolStats && setPoolInfo(data.data.poolStats)
        )
        .catch((e) => {
          console.log(e.message);
        });
    };

    handleFetchPoolInfo();
  }, [chainId, poolAddress, poolType]);

  return (
    <div
      className={cn(
        "px-4 py-3 border border-stroke rounded-md text-subText text-sm",
        positionId ? "mb-4" : "mb-[10px]"
      )}
    >
      <div className="flex max-sm:flex-col justify-between gap-[6px]">
        <div className="flex flex-col max-sm:!flex-row max-sm:justify-between items-start gap-1">
          <span>TVL</span>
          {initializing ? (
            <Skeleton className="w-16 h-5" />
          ) : (
            <span className="text-text">
              {poolInfo?.tvl || poolInfo?.tvl === 0
                ? formatDisplayNumber(poolInfo.tvl, {
                    style: "currency",
                    significantDigits: 6,
                  })
                : "--"}
            </span>
          )}
        </div>
        <div className="flex flex-col max-sm:!flex-row max-sm:justify-between items-start gap-1">
          <span>24h Volume</span>
          {initializing ? (
            <Skeleton className="w-16 h-5" />
          ) : (
            <span className="text-text">
              {poolInfo?.volume24h || poolInfo?.volume24h === 0
                ? formatDisplayNumber(poolInfo.volume24h, {
                    style: "currency",
                    significantDigits: 6,
                  })
                : "--"}
            </span>
          )}
        </div>
        <div className="flex flex-col max-sm:!flex-row max-sm:justify-between items-start gap-1">
          <span>24h Fees</span>
          {initializing ? (
            <Skeleton className="w-16 h-5" />
          ) : (
            <span className="text-text">
              {poolInfo?.fees24h || poolInfo?.fees24h === 0
                ? formatDisplayNumber(poolInfo.fees24h, {
                    style: "currency",
                    significantDigits: 6,
                  })
                : "--"}
            </span>
          )}
        </div>
        <div className="flex flex-col max-sm:!flex-row max-sm:justify-between items-start gap-1">
          <span>Est. APR</span>
          {initializing ? (
            <Skeleton className="w-16 h-5" />
          ) : (
            <div
              className={`flex items-center gap-1 ${poolApr > 0 ? "text-accent" : "text-text"}`}
            >
              {formatAprNumber(poolApr) + "%"}
              {isFarming ? (
                <MouseoverTooltip
                  text={
                    <div>
                      LP Fee APR: {formatAprNumber(poolInfo?.apr24h || 0)}%
                      <br />
                      EG Sharing Reward:{" "}
                      {formatAprNumber(poolInfo?.kemEGApr || 0)}%
                      <br />
                      LM Reward: {formatAprNumber(poolInfo?.kemLMApr || 0)}%
                    </div>
                  }
                  placement="top"
                  width="fit-content"
                >
                  <FarmingIcon width={20} height={20} />
                </MouseoverTooltip>
              ) : null}
            </div>
          )}
        </div>
      </div>
      {isUniv2 && !!positionId && (
        <div className="flex justify-between items-start gap-1 mt-3 border-t border-stroke pt-2">
          <span>Pool Share</span>
          <span className="text-text">
            {poolShare || poolShare === 0
              ? poolShare < 0.01
                ? "<0.01%"
                : poolShare + "%"
              : "--"}
          </span>
        </div>
      )}
    </div>
  );
}
