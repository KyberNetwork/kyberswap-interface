import { PATHS, PoolType } from "@/constants";
import { formatDisplayNumber } from "@/utils/number";
import { cn } from "@kyber/utils/tailwind-helpers";
import { useEffect, useState } from "react";

interface PoolInfo {
  tvl: number;
  volume24h: number;
  fees24h: number;
  apr24h: number;
}

export default function PoolInfo({
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
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);

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
        "px-4 py-3 border border-stroke rounded-md text-subText text-sm flex flex-col gap-[6px]",
        positionId ? "mb-4" : "mb-[10px]"
      )}
    >
      <div className="flex justify-between">
        <span>TVL</span>
        <span className="text-text">
          {poolInfo?.tvl
            ? formatDisplayNumber(poolInfo.tvl, {
                style: "currency",
                significantDigits: 6,
              })
            : "--"}
        </span>
      </div>
      <div className="flex justify-between">
        <span>24h Volume</span>
        <span className="text-text">
          {poolInfo?.volume24h
            ? formatDisplayNumber(poolInfo.volume24h, {
                style: "currency",
                significantDigits: 6,
              })
            : "--"}
        </span>
      </div>
      <div className="flex justify-between">
        <span>24h Fees</span>
        <span className="text-text">
          {poolInfo?.fees24h
            ? formatDisplayNumber(poolInfo.fees24h, {
                style: "currency",
                significantDigits: 6,
              })
            : "--"}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Est. APR</span>
        <span
          className={
            poolInfo?.apr24h && poolInfo.apr24h > 0
              ? "text-accent"
              : "text-text"
          }
        >
          {poolInfo?.apr24h
            ? formatDisplayNumber(poolInfo.apr24h, {
                significantDigits:
                  poolInfo.apr24h < 1
                    ? 2
                    : poolInfo.apr24h < 10
                    ? 3
                    : poolInfo.apr24h < 100
                    ? 4
                    : 5,
              }) + "%"
            : "--"}
        </span>
      </div>
    </div>
  );
}
