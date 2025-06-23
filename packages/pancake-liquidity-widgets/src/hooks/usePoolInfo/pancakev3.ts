import { Address } from "viem";
import { useEffect, useState } from "react";
import { useWeb3Provider } from "@/hooks/useProvider";
import {
  NetworkInfo,
  PoolType,
  PANCAKE_NATIVE_TOKEN_ADDRESS,
  NATIVE_TOKEN_ADDRESS,
  CoreProtocol,
} from "@/constants";
import { Pool } from "@/entities/Pool";
import { Position } from "@/entities/Position";
import { getPoolInfo, getPositionInfo, isForkFrom } from "@/utils";

export interface TokenInfo {
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  address: string;
  logoURI: string;
}

export default function usePoolInfo(
  poolAddress: string,
  positionId: string | undefined,
  poolType: PoolType
): {
  pool: Pool | null;
  loading: boolean;
  position: Position | null;
  positionOwner: Address | null;
  error: string;
} {
  const [loading, setLoading] = useState(true);
  const [pool, setPool] = useState<Pool | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [positionOwner, setPositionOwner] = useState<Address | null>(null);
  const [error, setError] = useState("");

  const { chainId, publicClient } = useWeb3Provider();

  useEffect(() => {
    const getZapInfo = async () => {
      if (!publicClient || !!pool) {
        setLoading(false);
        return;
      }

      const poolInfo = await getPoolInfo({
        poolAddress,
        poolType,
        chainId,
        publicClient,
      });

      if (!poolInfo) {
        setError(
          `Can't get Pool info for pool address ${poolAddress.substring(
            0,
            6
          )}...${poolAddress.substring(36)} on ${NetworkInfo[chainId].name}`
        );
        return;
      }
      setPool(poolInfo);

      if (positionId) {
        const positionInfo = await getPositionInfo({
          chainId,
          publicClient,
          poolType,
          positionId,
        });

        const { owner, tickLower, tickUpper, liquidity, token0, token1, fee } =
          positionInfo;

        if (!tickLower || !tickUpper || !liquidity || !fee) {
          setError(`can't get position info`);
          return;
        }

        if (owner) setPositionOwner(owner as Address);

        const isPancakeV3 = isForkFrom(poolType, CoreProtocol.PancakeSwapV3);

        const token0Address = (
          isPancakeV3
            ? token0
            : token0 === PANCAKE_NATIVE_TOKEN_ADDRESS
            ? NATIVE_TOKEN_ADDRESS
            : token0
        )?.toLowerCase();

        const token1Address = (
          isPancakeV3
            ? token1
            : token1 === PANCAKE_NATIVE_TOKEN_ADDRESS
            ? NATIVE_TOKEN_ADDRESS
            : token1
        )?.toLowerCase();

        if (
          token0Address !== poolInfo.token0.address.toLowerCase() ||
          token1Address !== poolInfo.token1.address.toLowerCase()
        ) {
          setError(
            `Position ${positionId} does not belong to the pool ${poolInfo.token0.symbol}-${poolInfo.token1.symbol}`
          );
          return;
        }

        const position = new Position({
          pool: poolInfo,
          tickLower: tickLower,
          tickUpper: tickUpper,
          liquidity: liquidity.toString(),
        });

        setPosition(position);
      }
      setLoading(false);
    };

    getZapInfo();
  }, [chainId, poolType, pool, poolAddress, positionId, publicClient]);

  useEffect(() => {
    let i: ReturnType<typeof setInterval> | undefined;
    if (!!pool && publicClient) {
      const getSlot0 = async () => {
        const poolInfo = await getPoolInfo({
          poolAddress,
          poolType,
          chainId,
          publicClient,
        });
        if (!poolInfo) return;

        const { liquidity, sqrtRatioX96, tickCurrent, tickSpacing } = poolInfo;

        setPool(
          new Pool(
            pool.token0,
            pool.token1,
            pool.fee,
            sqrtRatioX96,
            liquidity,
            tickCurrent,
            tickSpacing
          )
        );
      };

      i = setInterval(() => {
        getSlot0();
      }, 15_000);
    }

    return () => {
      i && clearInterval(i);
    };
  }, [chainId, poolType, pool, poolAddress, publicClient]);

  return { loading, pool, position, error, positionOwner };
}
