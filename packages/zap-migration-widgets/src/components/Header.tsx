import { usePoolsStore } from "../stores/usePoolsStore";
import X from "../assets/icons/x.svg";
import { PoolInfo } from "./PoolInfo";
import { ChainId } from "..";
import { Skeleton } from "@kyber/ui/skeleton";

export function Header({
  onClose,
  chainId,
}: {
  onClose: () => void;
  chainId: ChainId;
}) {
  const { pools } = usePoolsStore();

  return (
    <>
      <div className="flex items-center justify-between text-xl font-medium">
        {pools === "loading" ? (
          <Skeleton className="w-[300px] h-7" />
        ) : (
          <div>
            Migrate from {pools[0].token0.symbol}/{pools[0].token1.symbol} to{" "}
            {pools[1].token0.symbol}/{pools[1].token1.symbol}
          </div>
        )}
        <button onClick={onClose}>
          <X className="text-subText" />
        </button>
      </div>

      <div className="flex gap-[48px] mt-8">
        <div className="flex-1">
          <PoolInfo
            pool={pools === "loading" ? "loading" : pools[0]}
            chainId={chainId}
          />
        </div>
        <div className="flex-1">
          <PoolInfo
            pool={pools === "loading" ? "loading" : pools[1]}
            chainId={chainId}
          />
        </div>
      </div>
    </>
  );
}
